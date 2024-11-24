function shouldBlock(uri, filterList) {
  let blocked = false;
  let allow = false;

  for (let filter of filterList) {
    filter = filter.trim();
    if (!filter) {
      continue; // Skip empty lines
    }

    let filterData = filterToRegExp(filter);
    if (!filterData) {
      continue; // Invalid filter, skip
    }

    if (filterData.regex.test(uri)) {
      if (filterData.isException) {
        allow = true;
      } else {
        blocked = true;
      }
    }
  }

  if (allow) {
    return false; // Allow
  } else if (blocked) {
    return true; // Block
  } else {
    return false; // Allow by default
  }
}

function filterToRegExp(filter) {
  let isException = false;
  if (filter.startsWith("@@")) {
    isException = true;
    filter = filter.substring(2);
  }

  // Remove options (we are ignoring them in this implementation)
  let optionsIndex = filter.indexOf("$");
  if (optionsIndex !== -1) {
    filter = filter.substring(0, optionsIndex);
  }

  if (!filter) {
    return null;
  }

  if (filter.startsWith("/") && filter.endsWith("/") && filter.length > 1) {
    // Regular expression filter
    let regexPattern = filter.substring(1, filter.length - 1);
    try {
      let regex = new RegExp(regexPattern);
      return { regex: regex, isException: isException };
    } catch (e) {
      // Invalid regex
      return null;
    }
  } else {
    let regexPattern = "";
    let index = 0;

    if (filter.startsWith("||")) {
      // Matches beginning of domain name
      regexPattern += "^(?:[^:/?#]+:)?(?://)?(?:[^/?#]*\\.)?";
      index = 2;
    } else if (filter.startsWith("|")) {
      // Matches beginning of the URL
      regexPattern += "^";
      index = 1;
    }

    let endWithAnchor = false;
    if (filter.endsWith("|")) {
      endWithAnchor = true;
      filter = filter.substring(0, filter.length - 1);
    }

    let pattern = filter.substring(index);
    pattern = escapeRegExp(pattern);

    // Replace Adblock Plus wildcards and special characters
    pattern = pattern.replace(/\\\*/g, ".*");
    pattern = pattern.replace(/\\\^/g, "[^a-zA-Z0-9_\\-\\.%]");

    regexPattern += pattern;

    if (endWithAnchor) {
      regexPattern += "$";
    }

    try {
      let regex = new RegExp(regexPattern);
      return { regex: regex, isException: isException };
    } catch (e) {
      // Invalid regex
      return null;
    }
  }
}

function escapeRegExp(s) {
  return s.replace(/([.*+?^${}()|\[\]\\])/g, "\\$1");
}

/**
 * Parses a string containing Adblock Plus filters and returns an array of filters.
 * @param {string} filterString - The string containing the filters.
 * @returns {string[]} - An array of filter strings.
 */
function parseFilterList(filterString) {
  const lines = filterString.split(/\r?\n/);
  const filters = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) {
      // Skip empty lines and comments (lines starting with ! or [)
      continue;
    }
    filters.push(line);
  }

  return filters;
}

// // Example usage:

// const adblockListString = `
// ! Comment line
// ||example.com^
// ||ads.example.com^
// @@||example.com/allow$script
// /banner\\.jpg$
// `;

// const uri = 'http://example.com/ads/banner.jpg';
// const filterList = parseFilterList(adblockListString);

// console.log(shouldBlock(uri, filterList)); // Output: false (blocked)
