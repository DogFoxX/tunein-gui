export interface ProfileParseData {
	name: string;
	radioData: string;
	glob_force: {
		enable: 'true' | 'false';
		text: string;
	};
	target_vol: {
		enable: 'true' | 'false';
		text: string;
	};
	tracks: {
		track: {
			number: string;
			volume: string;
		}[];
	};
}

export interface XMLParseData {
	fmod: string;
	radio: {
		id: string;
		name: string;
		logo?: string;
		songs?: {
			song: {
				file: string;
				name: string;
				artist: string;
				year: string;
				lenght: string;
				force: string;
				volume: string;
			}[];
		};
	};
}
