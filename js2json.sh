if [ $# -lt 1 ]; then
    echo "Usage: js2json.sh <inputFile>"
    exit 1;
fi

if [ "$(uname -s)" = "Darwin" ]
then
    REGEX_PARAM="-E"
else
    REGEX_PARAM="-r"
fi

sed -r 's/(\w+): /"\1": /g' "$1" | \
    sed "$REGEX_PARAM" "s/'(.*?)'/\"\1\"/g" | \
    sed "$REGEX_PARAM" "s/\\\\'/'/g" | \
    sed "$REGEX_PARAM" "s/undefined/null/g"
