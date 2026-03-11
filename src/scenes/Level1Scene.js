import Phaser from "phaser";
import { loadCoreAssets }  from '../pipelines/load/loadCoreAssets';
import { loadArmoryAssets } from '../pipelines/load/loadArmoryAssets';
import { loadMapAssets }   from '../pipelines/load/loadMapAssets';
import { loadHUDAssets }   from '../pipelines/load/loadHUDAssets';
import { initMap }         from '../pipelines/init/initMap';
import { initPlayer }      from '../pipelines/init/initPlayer';
import { initSystems }     from '../pipelines/init/initSystems';
import { initUI }          from '../pipelines/init/initUI';
import { initActions }     from '../pipelines/init/initActions';
import { initEnemies }     from '../pipelines/init/initEnemies';
import { updatePlayer }    from '../pipelines/update/updatePlayer';
import { updateHUD }       from '../pipelines/update/updateHUD';
import { updateCamera }    from '../pipelines/update/updateCamera';
import { updateEnemies }   from '../pipelines/update/updateEnemies';
import { setupInput }      from '../input/input';
import { setupKeybinds }   from '../input/keybinds';
import ClockDisplay from '../ui/ClockDisplay';
import levelClock   from '../systems/LevelClock';

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Level1Scene" });
  }

  preload() {
    loadCoreAssets(this);
    loadArmoryAssets(this);
    loadMapAssets(this);
    loadHUDAssets(this);
  }

  create() {
    initMap(this);
    initPlayer(this);
    initSystems(this);
    initUI(this);
    initActions(this);
    initEnemies(this);
    setupInput(this);
    setupKeybinds(this);
    this.clockDisplay = new ClockDisplay(this, levelClock);
    this.events.emit('scene:ready');
  }

  shutdown() {
    this.events.emit('scene:shutdown');
  }

  update() {
    updatePlayer(this);
    updateHUD(this);
    updateCamera(this);
    updateEnemies(this);
    this.clockDisplay.update();
  }
}
