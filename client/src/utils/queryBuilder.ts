export const queryBuilder = (path: string) => {
  return "http://backend:5000" + path;
  const API_HOST = process.env.REACT_APP_API_HOST;
  console.log(API_HOST);
  return API_HOST + path;
};
