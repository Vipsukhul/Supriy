
import { Role } from "@/models/user.model";
import { regions, allRegionsOption } from "./regions";

interface PredefinedUser {
    name: string;
    email: string;
    role: Role;
    region?: string;
}

const generateUsers = (): PredefinedUser[] => {
    const users: PredefinedUser[] = [];

    // Country Manager
    users.push({
        name: "Country Manager",
        email: "country-manager@debtflow.com",
        role: "Country Manager",
        region: allRegionsOption,
    });

    // Managers for each region
    regions.forEach(region => {
        users.push({
            name: `Manager - ${region}`,
            email: `manager-${region.toLowerCase()}@debtflow.com`,
            role: "Manager",
            region: region,
        });
    });

    // Engineers for each region
    regions.forEach(region => {
        users.push({
            name: `Engineer - ${region}`,
            email: `engineer-${region.toLowerCase()}@debtflow.com`,
            role: "Engineer",
            region: region,
        });
    });
    
    return users;
};

export const predefinedUsers = generateUsers();

export const getUsersForRole = (role: Role): PredefinedUser[] => {
    return predefinedUsers.filter(user => user.role === role);
}

export const generatePassword = (role: Role, region?: string): string | null => {
    if (role === "Country Manager") {
        return "CountAll1812";
    }

    if (!region) return null;

    const regionPrefix = region.slice(0, 4).toLowerCase();

    if (role === "Manager") {
        return `${regionPrefix}mana1812`;
    }

    if (role === "Engineer") {
        return `${regionPrefix}engi1812`;
    }

    return null;
}
