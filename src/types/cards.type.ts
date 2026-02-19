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
    duplicates: string[];
    wanted: string[];
    createdAt: Date;
}

export interface DuplicateWithInterest {
    duplicateId: number;
    cardNumber: string;
    isInterestedByCurrentUser: boolean;
}

export interface MemberPageData {
    id: number;
    displayName: string;
    duplicates: DuplicateWithInterest[];
    wanted: string[];
    createdAt: Date;
    isOwnProfile: boolean;
    isLoggedIn: boolean;
}

export interface InterestOnMyDuplicate {
    duplicateId: number;
    cardNumber: string;
    interestedMember: {
        id: number;
        displayName: string;
    };
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
