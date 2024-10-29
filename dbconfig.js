const config = {
    user: "root",
    password: "1234",
    connectString: "localhost/orcl",
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
  };
  export default config;