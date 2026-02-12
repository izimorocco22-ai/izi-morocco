import path from "path"
import fs from "fs"

const loadModels = () => {
  const modelsPath = path.join(__dirname, '../models');
  if (!fs.existsSync(modelsPath)) {
    console.warn('Models directory not found at:', modelsPath);
    return;
  }

  fs.readdirSync(modelsPath).forEach((file) => {
    // Only load .ts or .js files, and skip directory entries
    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')) {
      try {
        // Use require for better compatibility with different Node versions and build setups
        require(path.join(modelsPath, file));
      } catch (error) {
        console.error(`Failed to load model ${file}:`, error);
      }
    }
  });
}

export default loadModels