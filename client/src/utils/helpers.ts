export const hexToUint8Array = (hexString: string): Uint8Array => {
    const hex = hexString.replace(/^0x/, '');
    const pairs = hex.match(/[\dA-F]{2}/gi) || [];
    return new Uint8Array(
        pairs.map(s => parseInt(s, 16))
    );
}; 