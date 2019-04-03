if [ $# -lt 2 ]; then
    echo "Usage: js2json.sh <inputFile> <outputFile>"
    exit 1;
fi

sed -r 's/(\w+): /"\1": /g' "$1" | \
    sed -r "s/'(.*?)'/\"\1\"/g" | \
    sed -r "s/\\\\'/'/g" | \
    sed -r "s/undefined/null/g" \
        > "$2"
