The JSON-Dicer, with spellcheck and filtering functionality
==============

Derscription
------------
This simple Node.js Script is used for generating a lot of smaller JSON files (approx. 250 bytes)
from a singleton bigger JSON Array[] file. Indeed for pagination.

Version
-------
1.0.0

Usage
-----
1. Checkout this repository
2. Open the CLI You like.
3. Navigate to the directory contains the checked out repository. 
4. Type: `npm install` to install dependency.
5. Download [Dictionary Extension of LibreOffice and Apache OpenOffice](http://extensions.openoffice.org/en/project/english-dictionaries-apache-openoffice)
6. UNPACK (dict-en.oxt), Get the Full Path of the unpacked directory
7. Finally...

```sh
$ node index.js [Options] <Full path to the Source JSON Array File> <Full path to the directory contains en_US.aff, en_US.dic, en_GB.aff, en_GB.dic)
```

Outputs can be found under `output` directory

### Options

```sh
-h, --help         output usage information
-V, --version      output the version number
-e, --entries <n>  How Many Entries in a single file?
-p, --pretty       Pretty Formatted JSON in the outputs
-m, --metadata     Generate an metadata JSON
-f, --filter       Filter Words that not matching Regex (Source: alphabets)
-s, --spell        Enable Spell Checker
```

### License
GPLv3