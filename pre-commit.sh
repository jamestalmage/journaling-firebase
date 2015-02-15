#!/bin/bash

# Pre-commit hook that prevents debugging code and merge artifacts from being committed.

FILES_PATTERN='\.(rb|erb|haml|js|coffee)(\..+)?$'
FORBIDDEN=( "binding\.pry" "console\.log" "console\.debug" "save_and_open_page" "debugger" "it\.only" "describe\.only" ">>>>>>" "<<<<<<" "======" )

# the exit code from `grep -E $FILES_PATTERN` gets swallowed unless the pipefail option is set
set -o pipefail

FORBIDDEN_FOUND=false

# grep for forbidden patterns
for i in "${FORBIDDEN[@]}"
do
  git diff --cached --diff-filter=ACMR --name-only | grep -E $FILES_PATTERN | \
      GREP_COLOR='4;5;37;41' xargs grep --color --with-filename -n $i \
    && echo -e 'WARNING: Found' $i 'references. Commit with \033[0;32m--no-verify \033[0mto bypass this check.' \
    && FORBIDDEN_FOUND=true
done

$FORBIDDEN_FOUND && exit 1


gulp lint
if [[ $? -ne 0 ]] ; then
  exit 1
fi

exit 0