
const { keith } = require("../keizzah/keith");
const GitHubAPI = require("../keizzah/github");
const s = require("../set");

keith({
  nomCom: 'githubconfig',
  aliase: 'checkgithub',
  categorie: "Admin",
  reaction: '🔧'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  const token = process.env.GITHUB_API || "";
  
  if (!token) {
    return repondre("❌ GITHUB_API secret is not set. Please set it using the Secrets tool.");
  }
  
  try {
    // Initialize GitHub API
    const github = new GitHubAPI(token);
    const owner = "Beltah254";
    const repo = "BELTAH-MD";
    
    // Try to get a file to test the API
    repondre("🔍 Testing GitHub API connection...");
    
    const readme = await github.getFileContent(owner, repo, "README.md");
    
    if (readme) {
      repondre(`✅ GitHub API configured correctly!\n\nRepository: ${owner}/${repo}\nAPI Token starts with: ${token.substring(0, 4)}${"*".repeat(token.length - 8)}${token.substring(token.length - 4)}`);
    } else {
      repondre("❌ Could not fetch files from GitHub. The token may be invalid or the repository doesn't exist.");
    }
  } catch (error) {
    repondre(`❌ Error testing GitHub API: ${error.message}`);
  }
});
