const isSpace = (str: string) => {
  const lastChar = str[str.length - 1];
  return lastChar === " " || lastChar === "\t";
};

export const setValueNoSpace = (str: string, update: (str: string) => void) => {
  if (!isSpace(str)) {
    update(str);
  }
};
