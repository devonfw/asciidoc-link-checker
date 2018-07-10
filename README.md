# Asciidoc-link-checker

[![build status](https://travis-ci.org/oasp/asciidoc-link-checker.svg?branch=develop)](https://travis-ci.org/oasp/asciidoc-link-checker)

Tool to check each link of each asciidoc inside a wiki of a gitHub repository

# How to use

1.  Clone this repository into a local folder on your computer or install the tool globally:

    `npm install -g @oasp/asciidoc-link-checker`

2.  Open the console and move to that folder.
3.  Install the dependencies:

    `npm install`

4.  (OPTIONAL) In order to make your own **asciidoc-link-checker** releases you need to install globally `np`:

    `npm install -g np`

5.  Clone the wiki you want to check links:

    `git clone https://github.com/my-repository/my-repository.wiki.git`

6.  Start the checkout:

    `$ linkchecker ./my-repository.wiki/`

The tool will check each link of each asciidoc inside the wiki searching those links that are wrong

# Output

When the check is done, you will see on your console the links that didn't work and an exit code

If all links are correct you will see:
'Done: All links are correct'

Otherwise you will see:
'Done: Some link failed'
