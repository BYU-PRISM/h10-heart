export async function readCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      resolve({
        name: file.name,
        size: file.size,
        text: text
      });
    };
    reader.onerror = (e) => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}
