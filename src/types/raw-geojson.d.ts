declare module '*.geojson?raw' {
  const content: string;
  export default content;
}

declare module '*.geojson' {
  // allow importing as JSON in environments that support it
  const value: any;
  export default value;
}
