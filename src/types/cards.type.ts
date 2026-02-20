export interface CardValidationResult {
    valid: string[];
    invalid: string[];
}

export interface ParsedCard {
    cardNumber: string;
    cardType: 'numeric' | 'letter';
}

export interface MemberWithDuplicates {
    id: number;
    displayName: string;
    team: string | null;
    duplicates: string[];
    wanted: string[];
    createdAt: Date;
}

export interface CardWithMembers {
    cardNumber: string;
    members: {
        id: number;
        displayName: string;
    }[];
}

export interface AlbumConfigData {
    maxNumericCard: number;
    maxLetterPrefix: string;
    maxLetterNumber: number;
}
