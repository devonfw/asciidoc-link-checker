# Asciidoc-link-checker
Tool to check each link of each asciidoc inside a wiki of a gitHub repository
# How to use

1. Install the tool globally:

	`npm install -g @oasp/asciidoc-link-checker`

2. Clone the wiki you want to check links:

	`git clone https://github.com/my-repository/my-repository.wiki.git`

3. Start the checkout:

	`$ linkchecker ./my-repository.wiki/`

The tool will check each link of each asciidoc inside the repository searching those links that are wrong

# Output
When the check is done, you will see on your console the links that didn't work along with one of this messages:

If all links are correct you will see:
'Done: All links are correct'

Otherwise you will see:
'Done: Some link failed' 
