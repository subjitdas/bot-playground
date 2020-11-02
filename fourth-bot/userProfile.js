
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

class UserProfile {
    constructor(name, gender, dob, maritalStatus) {
        this.name = name;
        this.gender = gender;
        this.dob = dob;
        this.maritalStatus = maritalStatus;
    }
}

module.exports.UserProfile = UserProfile;