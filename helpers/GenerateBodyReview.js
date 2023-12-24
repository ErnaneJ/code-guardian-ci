module.exports = function GenerateBodyReview({pr_number, diffData}) {
  let body = `Pull Request #${pr_number} has been updated with: \n`
  body += `- ${diffData.changes} changes \n`
  body += `- ${diffData.additions} additions \n`
  body += `- ${diffData.deletions} deletions \n\n`
  return body
}