declare module 'dcmjs' {
  export namespace parse {
    function parseDicom(buffer: Uint8Array): any;
  }

  export namespace data {
    class DicomMessage {
      static readFile(arrayBuffer: ArrayBuffer): DicomMessage;
      dict: Record<string, any>;
    }
  }
}
