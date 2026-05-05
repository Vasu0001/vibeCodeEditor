interface TemplateFileItem {
  filename: string;
  fileExtension: string;
  content: string;
}

interface TemplateFolderItem {
  folderName: string;
  items: TemplateItem[];
}

type TemplateItem = TemplateFileItem | TemplateFolderItem;

interface WebContainerFile {
  file: {
    contents: string;
  };
}

interface WebContainerDirectory {
  directory: {
    [key: string]: WebContainerFile | WebContainerDirectory;
  };
}

type WebContainerFileSystem = Record<string, WebContainerFile | WebContainerDirectory>;

function getFileName(item: TemplateFileItem) {
  return item.fileExtension
    ? `${item.filename}.${item.fileExtension}`
    : item.filename;
}

export function transformToWebContainerFormat(template: { folderName: string; items: TemplateItem[] }): WebContainerFileSystem {
  function processItem(item: TemplateItem): WebContainerFile | WebContainerDirectory {
    if ("folderName" in item) {
      // This is a directory
      const directoryContents: WebContainerFileSystem = {};
      
      item.items.forEach(subItem => {
        const key = "filename" in subItem
          ? getFileName(subItem)
          : subItem.folderName;
        directoryContents[key] = processItem(subItem);
      });

      return {
        directory: directoryContents
      };
    } else {
      // This is a file
      return {
        file: {
          contents: item.content
        }
      };
    }
  }

  const result: WebContainerFileSystem = {};
  
  template.items.forEach(item => {
    const key = "filename" in item
      ? getFileName(item)
      : item.folderName;
    result[key] = processItem(item);
  });

  return result;
}
