function CaptureDiffMetaData(changedFiles) {
  let diffData = { additions: 0, deletions: 0,  changes: 0 };

  return changedFiles.reduce((acc, file) => {
    acc.additions += file.additions;
    acc.deletions += file.deletions;
    acc.changes += file.changes;
    return acc;
  }, diffData);
}

module.exports = CaptureDiffMetaData;