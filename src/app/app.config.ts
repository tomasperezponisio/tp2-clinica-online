import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient} from "@angular/common/http";
import {provideFirebaseApp, initializeApp} from "@angular/fire/app";
import {environment} from "../environment";
import {getFirestore, provideFirestore} from "@angular/fire/firestore";
import {getDatabase, provideDatabase} from "@angular/fire/database";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {getStorage, provideStorage} from "@angular/fire/storage";
import {provideAuth, getAuth} from "@angular/fire/auth";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment)),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()), provideAnimationsAsync(),
    provideStorage(()=>getStorage()),
    provideAuth(() => getAuth()),
  ]
};
