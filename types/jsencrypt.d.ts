declare module 'jsencrypt' {
    export default class JSEncrypt {
        constructor();
        setPublicKey(pubkey: string): void;
        encrypt(str: string): string | false;
    }
}
