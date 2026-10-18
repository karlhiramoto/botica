import { GameCoordinator } from './engine/gameCoordinator';
import { FarmaciaAppUi } from './ui/appUi';

function bootstrap(): void {
  const root = document.getElementById('app-root');
  if (!root) {
    throw new Error('Missing #app-root container in index.html');
  }
  const coordinator = new GameCoordinator();
  new FarmaciaAppUi(root, coordinator);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
