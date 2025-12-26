/**
 * Moo Module - Demonstrates using dependencies from commando home
 *
 * This module uses the 'cowsay' package installed to ~/.commando/node_modules/
 */

import cowsay from "cowsay";

const message = cowsay.say({
  text: "Test",
  e: "oo", // Eyes
  T: "U ", // Tongue
});

console.log(message);
