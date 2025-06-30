import config from '../app.config.json';

type FederationConfig = {
  federationName: string;
  federationURL: string;
  tokenSymbol: string;
  tokenName: string;
  version: string;
};

export const federationConfig: FederationConfig = config;
