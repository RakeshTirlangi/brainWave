import { readFile } from 'fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url))
);

const dependencies = packageJson.dependencies;
const devDependencies = packageJson.devDependencies;

let requirements = '';

Object.entries(dependencies).forEach(([key, value]) => {
  requirements += `${key}==${value.replace('^', '')}\n`;
});

Object.entries(devDependencies).forEach(([key, value]) => {
  requirements += `${key}==${value.replace('^', '')}\n`;
});

await writeFile('requirements.txt', requirements);
