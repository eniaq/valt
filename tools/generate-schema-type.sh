#!/bin/sh

cd "$(dirname "$0")" || exit 1

{
echo "// This file is auto-generated. Do not edit it directly."
printf "export default "
tr -d '\n ' < ../valt.schema.json
echo " as const;"
} > ../src/schema.ts
