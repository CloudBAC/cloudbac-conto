import * as migration_20260303_121341 from './20260303_121341';
import * as migration_20260303_202700 from './20260303_202700';
import * as migration_20260303_215436 from './20260303_215436';
import * as migration_20260304_205122 from './20260304_205122';
import * as migration_20260305_063515 from './20260305_063515';
import * as migration_20260305_101339 from './20260305_101339';
import * as migration_20260308_173418 from './20260308_173418';

export const migrations = [
  {
    up: migration_20260303_121341.up,
    down: migration_20260303_121341.down,
    name: '20260303_121341',
  },
  {
    up: migration_20260303_202700.up,
    down: migration_20260303_202700.down,
    name: '20260303_202700',
  },
  {
    up: migration_20260303_215436.up,
    down: migration_20260303_215436.down,
    name: '20260303_215436',
  },
  {
    up: migration_20260304_205122.up,
    down: migration_20260304_205122.down,
    name: '20260304_205122',
  },
  {
    up: migration_20260305_063515.up,
    down: migration_20260305_063515.down,
    name: '20260305_063515',
  },
  {
    up: migration_20260305_101339.up,
    down: migration_20260305_101339.down,
    name: '20260305_101339',
  },
  {
    up: migration_20260308_173418.up,
    down: migration_20260308_173418.down,
    name: '20260308_173418'
  },
];
