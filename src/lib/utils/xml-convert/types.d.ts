export type XmlValue = string | any | XmlObject | XmlValue[];

export interface XmlObject {
	[key: string]: XmlValue;
}
