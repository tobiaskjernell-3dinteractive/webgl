#!/bin/bash

# Usage: ./rename-build.sh <old_name> <new_name>
# Example: ./rename-build.sh Addressables_web MyNewBuild
#
# This script replaces the build folder name across:
#   - src/components/UnityWindow/index.tsx
#   - vite.config.ts
#   - src/assets/<new_name>/index.html

OLD_NAME="$1"
NEW_NAME="$2"

if [ -z "$OLD_NAME" ] || [ -z "$NEW_NAME" ]; then
  echo "Usage: ./rename-build.sh <old_name> <new_name>"
  echo "Example: ./rename-build.sh Addressables_web MyNewBuild"
  exit 1
fi

ASSETS_DIR="src/assets"
OLD_DIR="$ASSETS_DIR/$OLD_NAME"
NEW_DIR="$ASSETS_DIR/$NEW_NAME"

# Check that the old build folder exists
if [ ! -d "$OLD_DIR" ]; then
  echo "Error: Folder '$OLD_DIR' does not exist."
  exit 1
fi

# 1. Rename the build folder
echo "Renaming folder: $OLD_DIR -> $NEW_DIR"
mv "$OLD_DIR" "$NEW_DIR"

# 2. Replace in src/components/UnityWindow/index.tsx
FILE="src/components/UnityWindow/index.tsx"
if [ -f "$FILE" ]; then
  sed -i "s|$OLD_NAME|$NEW_NAME|g" "$FILE"
  echo "Updated: $FILE"
else
  echo "Warning: $FILE not found, skipping."
fi

# 3. Replace in vite.config.ts
FILE="vite.config.ts"
if [ -f "$FILE" ]; then
  sed -i "s|$OLD_NAME|$NEW_NAME|g" "$FILE"
  echo "Updated: $FILE"
else
  echo "Warning: $FILE not found, skipping."
fi

# 4. Replace in the index.html inside the new build folder
FILE="$NEW_DIR/index.html"
if [ -f "$FILE" ]; then
  sed -i "s|$OLD_NAME|$NEW_NAME|g" "$FILE"
  echo "Updated: $FILE"
else
  echo "Warning: $FILE not found, skipping."
fi

echo ""
echo "Done! Replaced '$OLD_NAME' with '$NEW_NAME' in all files."
