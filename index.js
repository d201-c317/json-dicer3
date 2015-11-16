#! /usr/bin/env node
var program = require('commander');
var fs = require('fs');
var _ = require('underscore');
var SpellChecker = require('hunspell-spellchecker');
var start = new Date();

program
  .version('1.0.0')
  .option('-e, --entries <n>', 'How Many Entries in a single file?', 10)
  .option('-p, --pretty', 'Pretty Formatted JSON in the outputs', false)
  .option('-m, --metadata', 'Generate Metadata', false)
  .option('-f, --filter', 'Filter non-english words', false)
  .option('-s, --spell', 'Enable Spell Checker', false)
  .arguments('<cmd> <outputDir> [dictionaryPath]')
  .action(function (cmd, outputDir, dictionaryPath) {
    cmdValue = cmd;
    dictionaryPathValue = dictionaryPath;
    outputValue = outputDir;
  });


// Init Dictionary Buffer
var spellchecker_US = new SpellChecker();
var spellchecker_UK = new SpellChecker();
function InitDic(callback) {

  if (program.spell) {
    var DICT_US = spellchecker_US.parse({
      aff: fs.readFileSync(dictionaryPathValue + "/en_US.aff"),
      dic: fs.readFileSync(dictionaryPathValue + "/en_US.dic")
    });

    var DICT_UK = spellchecker_UK.parse({
      aff: fs.readFileSync(dictionaryPathValue + "/en_GB.aff"),
      dic: fs.readFileSync(dictionaryPathValue + "/en_GB.dic")
    });

    callback && callback(DICT_US, DICT_UK);
  } else {
    callback && callback(null, null);
  }
}
// End Dictionary Buffer

program.parse(process.argv);

/**
 * File Reader
 * @param callback   Result Exported For Downstream Processing
 */
function readfile(callback) {
  fs.readFile(cmdValue, 'utf8', function (err, data) {
    if (err) {
      callback && callback(err);
    } else {
      var dir = './' + outputValue;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback && callback(data);
    }
  });
}

/**
 * Upstream Result Parser
 * @param entry     Loaded JSON
 * @param DICT_US   Serialized US Dictionary
 * @param DICT_UK   Serialized UK Dictionary
 * @param callback  Output
 */
function parseFile(entry, DICT_US, DICT_UK, callback) {
  if (JSON.parse(JSON.stringify(entry)).errno) {
    console.error(JSON.parse(JSON.stringify(entry)).code);
    process.exit(1);
  } else {
    var data = JSON.parse(entry);

    if (program.filter && !program.spell) {
      var purified = _.filter(data, function (d) {
        return d.lemma.match(/^[A-Z]+$/i);
      });
      callback && callback(_.sortBy(purified, 'time').reverse());
    }

    if (program.spell && !program.filter) {
      spellchecker_US.use(DICT_US);
      spellchecker_UK.use(DICT_UK);
      var checked = _.filter(data, function (d) {
        return d.lemma.match(/^[A-Z]+$/i) && d.lemma.length > 1 && (spellchecker_US.check(d.lemma) || spellchecker_UK.check(d.lemma));
      });
      callback && callback(_.sortBy(checked, 'time').reverse());
    }

    if (!(program.filter || program.spell)) {
      callback && callback(_.sortBy(data, 'time').reverse());
    }
  }
}

/**
 * Write Outputs
 * @param entry     Callback From Upstream
 * @param callback  Result Exported For Downstream Processing
 */
function writeFile(entry, callback) {
  var jsonSrc = entry;
  console.log('Number of Entries: ' + jsonSrc.length);
  console.log('It can be diced into: ' + Math.ceil(Number(jsonSrc.length) / Number(program.entries)) + ' Files');
  var first = 0;
  var last = Number(program.entries);
  var cnt = 1;
  var out = {};
  for (first; first + Number(program.entries) < jsonSrc.length;) {
    for (last; last < jsonSrc.length; last = last + Number(program.entries), first = first + Number(program.entries), cnt++) {
      if (first == 0) {
        out = jsonSrc.slice(first, last);
      } else {
        out = jsonSrc.slice(first + 1, last);
      }
      if (program.pretty == true) {
        fs.writeFile('./' + outputValue + '/' + cnt + '.json', JSON.stringify(out, null, 2), 'utf8', null);
      } else {
        fs.writeFile('./' + outputValue + '/' + cnt + '.json', JSON.stringify(out), 'utf8', null);
      }
    }
    out = jsonSrc.slice(first, jsonSrc.length);
    if (program.pretty == true) {
      fs.writeFile('./' + outputValue + '/' + cnt + '.json', JSON.stringify(out, null, 2), 'utf8', null);
    } else {
      fs.writeFile('./' + outputValue + '/' + cnt + '.json', JSON.stringify(out), 'utf8', null);
    }
  }
  callback && callback(cnt);
}

/**
 * Main Runtime
 */
InitDic(function (DICT_US, DICT_UK) {
  readfile(function (result) {
    parseFile(result, DICT_US, DICT_UK, function (parsed) {
      writeFile(parsed, function (callback) {
        var end = new Date() - start;
        console.info(callback + " Files Generated");
        console.info("Execution time: %dms", end);
        if (program.metadata == true) {
          var metadata = {
            pages: callback
          };
          fs.writeFile('./' + outputValue + '/metadata.json', JSON.stringify(metadata, null, 2), 'utf8', null);
        }
      });
    });
  });
});

