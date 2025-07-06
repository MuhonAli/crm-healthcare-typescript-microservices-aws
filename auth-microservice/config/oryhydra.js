// const {Configuration, V0alpha2Api} = require('@ory/client');
import { Configuration, V0alpha2Api } from '@ory/client';

// const baseOptions: any = {}
// if (process.env.MOCK_TLS_TERMINATION) {
//   baseOptions.headers = { "X-Forwarded-Proto": "https" }
// }

const configuration = new Configuration({
  basePath: process.env.HYDRA_ADMIN_URL,
  // baseOptions,
})
export const hydraAdmin = new V0alpha2Api(configuration)
// module.exports = {hydraAdmin}
