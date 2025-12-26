/**
 * Moo Module - Demonstrates using dependencies from commando home
 *
 * This module uses the 'cowsay' package installed to ~/.commando/node_modules/
 */

import cowsay from 'cowsay';
import type { CommandoCommand } from '@planet57/commando/types';

/**
 * Make a cow say something
 */
export const say: CommandoCommand = {
  description: 'Make a cow say something',
  usage: '<text...>',

  execute: async (options, args, context) => {
    const text = args.join(' ');

    if (!text) {
      console.error('ERROR: Please provide text for the cow to say');
      console.error('Usage: cmdo moo say <text...>');
      process.exit(1);
    }

    const message = cowsay.say({
      text,
      e: 'oo',  // Eyes
      T: 'U ',  // Tongue
    });

    console.log(message);
  },
};

/**
 * Make a cow think something
 */
export const think: CommandoCommand = {
  description: 'Make a cow think something',
  usage: '<text...>',

  execute: async (options, args, context) => {
    const text = args.join(' ');

    if (!text) {
      console.error('ERROR: Please provide text for the cow to think');
      console.error('Usage: cmdo moo think <text...>');
      process.exit(1);
    }

    const message = cowsay.think({
      text,
      e: 'oo',
    });

    console.log(message);
  },
};
