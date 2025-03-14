// File to track bot version information
const fs = require('fs-extra');
const path = require('path');

// Store version info (This part is removed)
//const versionFilePath = path.join(__dirname, 'version_info.json');

// Initialize version info (This part is removed)
//if (!fs.existsSync(versionFilePath)) {
//  fs.writeJSONSync(versionFilePath, {
//    lastCommitSha: "",
//    lastUpdateTime: 0,
//    updateChecked: false
//  });
//}

// Get current version info (This part is removed)
//const getVersionInfo = () => {
//  try {
//    return fs.readJSONSync(versionFilePath);
//  } catch (error) {
//    console.error("Error reading version info:", error);
//    return {
//      lastCommitSha: "",
//      lastUpdateTime: 0,
//      updateChecked: false
//    };
//  }
//};

// Update version info (This part is removed)
//const updateVersionInfo = (info) => {
//  try {
//    fs.writeJSONSync(versionFilePath, info);
//    return true;
//  } catch (error) {
//    console.error("Error writing version info:", error);
//    return false;
//  }
//};

// Mark as update checked to prevent redundant notifications (This part is removed)
//const markUpdateChecked = () => {
//  const info = getVersionInfo();
//  info.updateChecked = true;
//  updateVersionInfo(info);
//};

module.exports = {
  //getVersionInfo,
  //updateVersionInfo,
  //markUpdateChecked
};