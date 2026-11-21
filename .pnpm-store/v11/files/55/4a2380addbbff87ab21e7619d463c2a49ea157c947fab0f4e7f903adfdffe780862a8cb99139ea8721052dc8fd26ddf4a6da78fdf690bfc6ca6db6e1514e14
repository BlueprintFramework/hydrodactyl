import StyleSheet from '../sheet';
import { Keyframes as KeyframesType, Stringifier } from '../types';
import { KEYFRAMES_SYMBOL } from '../utils/isKeyframes';
export default class Keyframes implements KeyframesType {
    readonly [KEYFRAMES_SYMBOL]: true;
    id: string;
    name: string;
    rules: string;
    constructor(name: string, rules: string);
    inject: (styleSheet: StyleSheet, stylisInstance?: Stringifier) => void;
    getName(stylisInstance?: Stringifier): string;
}
