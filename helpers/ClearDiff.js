module.exports = function ClearDiff(diff, ignoreFiles){
  return diff.split('\n').filter(line => {
    const matches = line.match(/^diff --git a\/(.+) b\/(.+)/);
    if (matches) {
      const filePath = matches[1];
      return !ignoreFiles.some(ignoredFile => filePath.startsWith(ignoredFile));
    }
    return true;
  });
}