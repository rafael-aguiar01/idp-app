import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';

import argocdPlugin, {
  argocdTranslationsModule,
} from '@backstage-community/plugin-argocd';

export default createApp({
  features: [catalogPlugin, 
    argocdPlugin,
    argocdTranslationsModule,
    navModule,
    homeModule
  ],
});
