/**
 * WebGL Memory Tracker
 * Tracks WebGL resources (textures, buffers, shaders) and estimates memory usage
 */

export interface WebGLResource {
  type: 'texture' | 'buffer' | 'renderbuffer' | 'program';
  sizeInBytes: number;
  createdAt: number;
  label?: string;
}

class WebGLMemoryTracker {
  private resources = new Map<string, WebGLResource>();
  private totalMemory = 0;

  /**
   * Calculate texture memory size based on format and dimensions
   */
  private calculateTextureSize(width: number, height: number, format: GLenum, type: GLenum): number {
    const pixelCount = width * height;

    // Determine bytes per pixel based on format and type
    let bytesPerPixel = 4; // default RGBA

    // Common formats
    if (format === 0x1906) { // GL_ALPHA
      bytesPerPixel = 1;
    } else if (format === 0x1907) { // GL_RGB
      bytesPerPixel = 3;
    } else if (format === 0x1908) { // GL_RGBA
      bytesPerPixel = 4;
    } else if (format === 0x1909) { // GL_LUMINANCE
      bytesPerPixel = 1;
    } else if (format === 0x190A) { // GL_LUMINANCE_ALPHA
      bytesPerPixel = 2;
    }

    // Adjust for type if compressed or special format
    if (type === 0x1401) { // GL_UNSIGNED_BYTE
      // Already correct
    } else if (type === 0x1403) { // GL_UNSIGNED_SHORT
      bytesPerPixel = Math.ceil(bytesPerPixel / 2) * 2;
    } else if (type === 0x1405) { // GL_UNSIGNED_INT
      bytesPerPixel = Math.ceil(bytesPerPixel / 4) * 4;
    }

    return pixelCount * bytesPerPixel;
  }

  /**
   * Register a texture and track its memory
   */
  registerTexture(
    textureId: string,
    width: number,
    height: number,
    format: GLenum = 0x1908, // default RGBA
    type: GLenum = 0x1401,   // default UNSIGNED_BYTE
    label?: string
  ): void {
    const sizeInBytes = this.calculateTextureSize(width, height, format, type);
    const resource: WebGLResource = {
      type: 'texture',
      sizeInBytes,
      createdAt: Date.now(),
      label,
    };

    // Remove old entry if exists
    if (this.resources.has(textureId)) {
      this.totalMemory -= this.resources.get(textureId)!.sizeInBytes;
    }

    this.resources.set(textureId, resource);
    this.totalMemory += sizeInBytes;
  }

  /**
   * Register a buffer and track its memory
   */
  registerBuffer(bufferId: string, sizeInBytes: number, label?: string): void {
    const resource: WebGLResource = {
      type: 'buffer',
      sizeInBytes,
      createdAt: Date.now(),
      label,
    };

    // Remove old entry if exists
    if (this.resources.has(bufferId)) {
      this.totalMemory -= this.resources.get(bufferId)!.sizeInBytes;
    }

    this.resources.set(bufferId, resource);
    this.totalMemory += sizeInBytes;
  }

  /**
   * Register a renderbuffer and track its memory
   */
  registerRenderbuffer(
    renderbufferId: string,
    width: number,
    height: number,
    sizePerPixel: number = 4, // typical for RGBA8
    label?: string
  ): void {
    const sizeInBytes = width * height * sizePerPixel;
    const resource: WebGLResource = {
      type: 'renderbuffer',
      sizeInBytes,
      createdAt: Date.now(),
      label,
    };

    // Remove old entry if exists
    if (this.resources.has(renderbufferId)) {
      this.totalMemory -= this.resources.get(renderbufferId)!.sizeInBytes;
    }

    this.resources.set(renderbufferId, resource);
    this.totalMemory += sizeInBytes;
  }

  /**
   * Unregister a resource (when it's deleted)
   */
  unregisterResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      this.totalMemory -= resource.sizeInBytes;
      this.resources.delete(resourceId);
    }
  }

  /**
   * Get total WebGL memory usage
   */
  getTotalMemory(): number {
    return this.totalMemory;
  }

  /**
   * Get breakdown by resource type
   */
  getMemoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {
      texture: 0,
      buffer: 0,
      renderbuffer: 0,
      program: 0,
    };

    this.resources.forEach(resource => {
      breakdown[resource.type] += resource.sizeInBytes;
    });

    return breakdown;
  }

  /**
   * Get all tracked resources
   */
  getResources(): WebGLResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Clear all tracked resources (usually called on context loss)
   */
  clear(): void {
    this.resources.clear();
    this.totalMemory = 0;
  }

  /**
   * Get resource count by type
   */
  getResourceCount(): Record<string, number> {
    const counts: Record<string, number> = {
      texture: 0,
      buffer: 0,
      renderbuffer: 0,
      program: 0,
    };

    this.resources.forEach(resource => {
      counts[resource.type]++;
    });

    return counts;
  }
}

// Global singleton instance
let instance: WebGLMemoryTracker | null = null;

export function getWebGLMemoryTracker(): WebGLMemoryTracker {
  if (!instance) {
    instance = new WebGLMemoryTracker();
  }
  return instance;
}

export function resetWebGLMemoryTracker(): void {
  if (instance) {
    instance.clear();
  }
  instance = null;
}
