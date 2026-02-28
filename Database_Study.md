# Database Study: AI-Exec Ecosystem

**Date:** 2026-02-28T13:52:20.170Z
**Scope:** SQL Tables + MongoDB Collections

--- 

## Table: `accessRightsInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| accessRightName | character varying | YES |
| accessRightDesc | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `advertisementAudioDeviceRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| advertisementID | bigint | YES |
| deviceTypeId | bigint | NO |
| isDefault | boolean | YES |
| defaultAdvertisement | boolean | YES |

**Relationships:**
- `deviceTypeId` -> FK -> `deviceTypeInfo`
- `advertisementID` -> FK -> `advertisementAudioInfo`

---

## Table: `advertisementAudioInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| advertisementName | character varying | NO |
| advertisementDescription | character varying | YES |
| advertisementLanguage | character varying | YES |
| advertisementVersion | character varying | NO |
| gender | text | YES |
| fileId | bigint | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `fileId` -> FK -> `fileInfo`

---

## Table: `advertisementInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| reqRefNo | character varying | YES |
| deviceId | bigint | NO |
| advertisementId | bigint | NO |
| time | bigint | YES |
| expirationTime | bigint | NO |
| tMsgRecvByServer | bigint | YES |
| tMsgRecvFromDev | bigint | YES |
| audioPlayed | smallint | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| messageOriginType | smallint | YES |
| deviceAvail | bigint | YES |
| tMsgAck | bigint | YES |
| tMsgTimeElapsed | bigint | YES |

---

## Table: `batteryTypeInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| batteryVersionId | bigint | NO |
| batteryType | bigint | NO |
| batteryName | character varying | NO |
| batteryTypeVersion | character varying | NO |
| manufacturerName | character varying | NO |
| batteryCapacity | integer | NO |
| adcConfig | bytea | YES |
| adcConfigVersion | bigint | NO |
| isVerified | boolean | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `certificateInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| certName | text | NO |
| keyName | text | YES |
| fetchType | smallint | YES |
| expiry | bigint | YES |
| isActive | boolean | YES |
| updatedCount | bigint | YES |
| createdBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `connectivityHistoryInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| deviceId | bigint | NO |
| connectivityStatus | boolean | YES |
| timeStamp | bigint | NO |
| createdBy | bigint | NO |
| createdAt | timestamp with time zone | YES |

---

## Table: `deviceAdvertisementRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| deviceId | bigint | NO |
| advertisementId | bigint | NO |
| repeatInterval | integer | YES |
| repeatCount | smallint | YES |
| minute | smallint | YES |
| hour | smallint | YES |
| dayOfMonth | smallint | YES |
| month | smallint | YES |
| dayOfWeek | smallint | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `deviceId` -> FK -> `deviceInfo`
- `advertisementId` -> FK -> `advertisementAudioInfo`

---

## Table: `deviceBriefInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| deviceId | bigint | NO |
| iccid | character varying | YES |
| imsi | character varying | YES |
| mobileNo | bigint | YES |
| mcc | smallint | YES |
| mnc | smallint | YES |
| batteryLevel | smallint | YES |
| currentRSSI | smallint | YES |
| currentNetworkType | smallint | YES |
| chargingStatus | smallint | YES |
| lastSeen | bigint | YES |
| currentFWVersion | text | YES |
| totalTransaction | bigint | YES |
| isBind | boolean | YES |
| updatedAt | timestamp with time zone | YES |

**Relationships:**
- `deviceId` -> FK -> `deviceInfo`

---

## Table: `deviceConfigInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| deviceId | bigint | NO |
| deviceTypeId | bigint | NO |
| deviceBriefId | bigint | NO |
| firmwareId | bigint | NO |
| defaultVolume | smallint | NO |
| enableDisableFallback | boolean | YES |
| mqttId | bigint | NO |
| mqttStatus | boolean | YES |
| httpId | bigint | NO |
| httpStatus | boolean | YES |
| groupId | bigint | NO |
| languageId | bigint | NO |
| systemAudioId | bigint | NO |
| loginTimeout | bigint | NO |
| statFreq | integer | NO |
| isActive | boolean | YES |
| connEnabledAt | bigint | YES |
| connDisabledAt | bigint | YES |
| connUpdatedBy | bigint | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| eventLoggerEnabled | boolean | YES |
| deviceMode | integer | YES |
| hardwareType | smallint | NO |
| firmwareMajorVersion | integer | NO |
| enableSimBindingLock | boolean | YES |
| batteryType | bigint | NO |
| batteryVersionId | bigint | NO |
| deviceStage | integer | YES |
| mqttCertUpdate | boolean | YES |
| configTimeOut | integer | NO |
| serverEventControl | smallint | NO |
| eventMask | bigint | NO |
| deviceFeatureMask | bigint | NO |
| httpPrcntThrshld | smallint | NO |
| httpDwnldPrcntThrshld | smallint | NO |
| bootPrcntThrshld | smallint | NO |
| bootPrcntThrshldWChrg | smallint | NO |
| audioPlayPrcntThrshld | smallint | NO |
| fotaBtryPrcntThrshld | smallint | NO |
| deviceUpdateStatus | smallint | NO |
| enableIMSILock | boolean | YES |

**Relationships:**
- `deviceBriefId` -> FK -> `deviceBriefInfo`
- `deviceId` -> FK -> `deviceInfo`
- `groupId` -> FK -> `groupInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`
- `httpId` -> FK -> `serverInfo`
- `mqttId` -> FK -> `serverInfo`
- `languageId` -> FK -> `languageAudioInfo`
- `firmwareId` -> FK -> `firmwareInfo`
- `systemAudioId` -> FK -> `systemAudioInfo`

---

## Table: `deviceIdentInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| imei | bigint | NO |
| terminalId | character varying | YES |
| mqttSubTopic | character varying | NO |
| mqttPubTopic | character varying | NO |
| isActive | boolean | YES |
| assignedAt | bigint | YES |
| unAssignedAt | bigint | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| apiKey | character varying | NO |
| tempApiKey | character varying | NO |
| changeApiKey | boolean | NO |
| apiKeyCreatedAt | timestamp with time zone | YES |
| relationId | bigint | YES |
| isBind | boolean | YES |
| deviceStage | integer | YES |
| deviceStatus | smallint | YES |

---

## Table: `deviceInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| imei | bigint | NO |
| deviceTypeId | bigint | NO |
| manufacturerTypeID | bigint | NO |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| deviceIdSequence | bigint | NO |

**Relationships:**
- `manufacturerTypeID` -> FK -> `manufacturerTypeInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`

---

## Table: `deviceRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| relationId | bigint | NO |
| deviceId | bigint | NO |
| isVerified | boolean | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedBy | bigint | YES |
| updatedAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `deviceId` -> FK -> `deviceInfo`

---

## Table: `deviceSimRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| simIccid | character varying | NO |
| deviceId | bigint | NO |
| iccidLock | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |

**Relationships:**
- `deviceId` -> FK -> `deviceInfo`
- `simIccid` -> FK -> `simInfo`

---

## Table: `deviceStatsInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| deviceId | bigint | NO |
| deviceUptime | bigint | YES |
| mqttUptime | bigint | YES |
| totalTransactionsPlayed | bigint | YES |
| totalTransactionsFailedToPlay | bigint | YES |
| volumeUpPressCounts | bigint | YES |
| volumeDownPressCounts | bigint | YES |
| replayPressCounts | bigint | YES |
| totalSIMInsertedCount | bigint | YES |
| totalModemResetCount | bigint | YES |
| totalNWFailureCount | bigint | YES |
| totalNWDiscDueToBadRSSICount | bigint | YES |
| mqttConnectionFailCount | bigint | YES |
| httpPostFailCount | bigint | YES |
| httpDownloadFailCount | bigint | YES |
| totalFilesDownloadedCount | bigint | YES |
| flashFileWriteFailCount | bigint | YES |
| flashFileReadFailCount | bigint | YES |
| totalLanguageChangeCount | bigint | YES |
| totalAdvertisementsChangeCount | bigint | YES |
| totalSystemAudioChangeCount | bigint | YES |
| createdAt | bigint | YES |

**Relationships:**
- `deviceId` -> FK -> `deviceInfo`

---

## Table: `deviceTypeInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| name | character varying | NO |
| networkType | character varying | NO |
| formFactor | character varying | NO |
| audioType | character varying | YES |
| isActive | boolean | YES |
| hardwareVersion | character varying | NO |
| manufacturerTypeId | bigint | NO |

**Relationships:**
- `manufacturerTypeId` -> FK -> `manufacturerTypeInfo`

---

## Table: `fileInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| fileName | character varying | NO |
| filePath | character varying | NO |
| fileType | smallint | NO |
| fileExtention | character varying | NO |
| fileChecksum | character varying | YES |
| fileDescription | character varying | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `firmwareInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| fwVersion | character varying | NO |
| description | character varying | YES |
| fileId | bigint | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| deviceTypeId | bigint | NO |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `fileId` -> FK -> `fileInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`

---

## Table: `firmware_info_dbf_keys` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| fwVersion | character varying | NO |
| description | character varying | YES |
| fileId | bigint | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| deviceTypeId | bigint | NO |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `fileId` -> FK -> `fileInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`

---

## Table: `groupHierarchyInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| groupLevel | character varying | YES |
| groupId | bigint | YES |
| levelA | bigint | YES |
| levelB | bigint | YES |
| levelC | bigint | YES |
| levelD | bigint | YES |
| levelE | bigint | YES |
| levelF | bigint | YES |
| levelG | bigint | YES |
| levelH | bigint | YES |
| levelI | bigint | YES |
| levelJ | bigint | YES |
| levelK | bigint | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `groupId` -> FK -> `groupInfo`

---

## Table: `groupInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| groupName | character varying | YES |
| groupDesc | character varying | YES |
| groupLevel | character varying | YES |
| imageId | bigint | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `imageId` -> FK -> `fileInfo`

---

## Table: `languageAudioDeviceRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| languageID | bigint | NO |
| deviceTypeId | bigint | NO |
| isDefault | boolean | YES |
| defaultLanguage | boolean | YES |

**Relationships:**
- `languageID` -> FK -> `languageAudioInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`

---

## Table: `languageAudioInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| languageName | character varying | NO |
| languageDescription | character varying | YES |
| languageVersion | character varying | NO |
| gender | text | YES |
| fileId | bigint | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| isMerged | boolean | NO |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `fileId` -> FK -> `fileInfo`

---

## Table: `manufacturerTypeInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| name | character varying | NO |
| addressDetails1 | character varying | YES |
| addressDetails2 | character varying | YES |
| addressDetails3 | character varying | YES |
| email | character varying | NO |
| mobileNo | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `merchantAuthInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| merchantId | character varying | NO |
| merchantDetailsConfirmed | boolean | YES |
| merchantMobileNo | character varying | YES |
| otp | integer | YES |
| otpCreatedAt | timestamp with time zone | YES |
| otpCheckFailedCount | smallint | YES |
| dailyOtpRequestCount | smallint | YES |
| otpUsed | boolean | YES |
| otpLockedTill | timestamp with time zone | YES |
| mpin | character varying | YES |
| mpinCreatedAt | timestamp with time zone | YES |
| mpinCheckFailedCount | smallint | YES |
| mpinValid | boolean | YES |
| resetMpinLockedTill | timestamp with time zone | YES |
| profileLockedTill | timestamp with time zone | YES |
| isActive | boolean | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `merchantId` -> FK -> `merchantInfo`

---

## Table: `merchantDeviceRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| terminalId | character varying | NO |
| deviceId | bigint | NO |

---

## Table: `merchantInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| reqRefNo | character varying | NO |
| merchantId | character varying | NO |
| merchantCategoryCode | character varying | YES |
| merchantBusinessName | character varying | YES |
| merchantLegalName | character varying | YES |
| merchantAddressDetails1 | character varying | YES |
| merchantAddressDetails2 | character varying | YES |
| merchantAddressDetails3 | character varying | YES |
| merchantCity | character varying | YES |
| merchantState | character varying | YES |
| merchantPincode | character varying | YES |
| merchantMobileNo | character varying | NO |
| merchantEmailId | character varying | NO |
| merchantContactName | character varying | YES |
| merchantPanVisa | character varying | YES |
| merchantMaster | character varying | YES |
| merchantRupay | character varying | YES |
| isBind | boolean | YES |
| deviceClientId | text | YES |
| isActive | boolean | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| assignedAt | bigint | YES |
| assignedBy | bigint | YES |
| unAssignedAt | bigint | YES |
| unAssignedBy | bigint | YES |
| groupId | bigint | NO |
| accountNumber | character varying | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| merchantStage | integer | YES |

**Relationships:**
- `groupId` -> FK -> `groupInfo`

---

## Table: `merchantRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| relationId | bigint | NO |
| merchantId | character varying | NO |
| isBind | boolean | YES |
| isVerified | boolean | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedBy | bigint | YES |
| updatedAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `merchantId` -> FK -> `merchantInfo`

---

## Table: `monthlyActiveDevicesInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| deviceId | bigint | NO |
| timeStamp | bigint | NO |
| createdBy | bigint | NO |
| createdAt | timestamp with time zone | YES |

---

## Table: `mqttBrokerInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| brokerAddr | character varying | YES |
| brokerPortNo | integer | NO |
| brokerStatus | smallint | YES |
| devicesConnected | bigint | YES |
| connLimit | bigint | NO |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `mqttUserInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| mqttBrokerId | bigint | NO |
| mqttSubTopic | character varying | NO |
| mqttPubTopic | character varying | NO |
| isConnected | boolean | YES |
| mqttTranStatus | boolean | YES |
| mqttAdvStatus | boolean | YES |
| lastSeen | bigint | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| deviceMode | smallint | YES |

**Relationships:**
- `id` -> FK -> `deviceConfigInfo`

---

## Table: `qrInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| merchantVPA | character varying | YES |
| qrType | character varying | YES |
| qrString | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedBy | bigint | YES |
| updatedAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `qrRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| relationId | bigint | NO |
| qrId | bigint | NO |
| isVerified | boolean | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedBy | bigint | YES |
| updatedAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `qrId` -> FK -> `qrInfo`

---

## Table: `roleInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| roleName | character varying | NO |
| roleDesc | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `rolesAccessRightsInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| roleId | bigint | YES |
| accessRightId | bigint | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `roleId` -> FK -> `roleInfo`
- `accessRightId` -> FK -> `accessRightsInfo`

---

## Table: `serverInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| serverHostName | character varying | YES |
| serverPortNo | integer | NO |
| serverKeepAlive | bigint | NO |
| authType | smallint | NO |
| mqttQOS | smallint | NO |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| serverType | smallint | YES |
| defaultServer | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `simInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| iccid | character varying | NO |
| simProviderId | bigint | NO |
| activationDate | timestamp with time zone | NO |
| expiryDate | timestamp with time zone | NO |
| dataType | character varying | NO |
| dataUsed | numeric | NO |
| dataUnits | bigint | NO |
| planName | character varying | NO |
| planStatus | character varying | NO |
| smsUnits | bigint | NO |
| smsUsed | bigint | NO |
| deviceId | bigint | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `simOperatorInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| operatorId | bigint | NO |
| operatorName | character varying | NO |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `simProfileInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| profileId | integer | NO |
| imsi | character varying | NO |
| msisdn | character varying | NO |
| simIccid | character varying | NO |
| operatorName | character varying | NO |
| operatorId | bigint | NO |
| isWhiteListed | boolean | NO |
| smsStatus | boolean | NO |
| profilePathInSim | character varying | NO |
| priority | integer | NO |
| simStatus | integer | NO |
| planName | character varying | NO |
| planCode | character varying | NO |
| apnType | character varying | NO |
| apnName | character varying | NO |
| apnIpType | character varying | NO |
| dataUsed | numeric | NO |
| dataType | character varying | NO |
| smsUsage | bigint | NO |
| lastStatus | integer | NO |
| lastSafeCustodyUpdate | timestamp with time zone | NO |
| totalUpdateCount | bigint | NO |
| isActive | boolean | YES |
| activationDate | timestamp with time zone | NO |
| expiryDate | timestamp with time zone | NO |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `operatorId` -> FK -> `simOperatorInfo`
- `simIccid` -> FK -> `simInfo`

---

## Table: `systemAudioDeviceRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| systemID | bigint | NO |
| deviceTypeId | bigint | NO |
| isDefault | boolean | YES |
| DefaultSystemAudio | boolean | YES |

**Relationships:**
- `systemID` -> FK -> `systemAudioInfo`
- `deviceTypeId` -> FK -> `deviceTypeInfo`

---

## Table: `systemAudioInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| systemAudioName | character varying | NO |
| systemAudioDescription | character varying | YES |
| systemAudioVersion | character varying | NO |
| gender | text | YES |
| fileId | bigint | YES |
| isActive | boolean | YES |
| isVerified | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `fileId` -> FK -> `fileInfo`

---

## Table: `terminalInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| terminalId | character varying | NO |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

---

## Table: `terminalRelationInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| relationId | bigint | NO |
| terminalId | character varying | NO |
| isVerified | boolean | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedBy | bigint | YES |
| updatedAt | timestamp with time zone | YES |
| deletedBy | bigint | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `terminalId` -> FK -> `terminalInfo`

---

## Table: `userAPIKeysInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| userId | bigint | NO |
| APIKey | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `userId` -> FK -> `userInfo`

---

## Table: `userGroupInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| userId | bigint | NO |
| groupId | bigint | YES |
| groupLevel | character varying | YES |
| isActive | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |

**Relationships:**
- `groupId` -> FK -> `groupInfo`
- `userId` -> FK -> `userInfo`

---

## Table: `userInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| firstName | character varying | YES |
| lastName | character varying | YES |
| location | character varying | YES |
| countryCode | character varying | YES |
| mobileNo | text | YES |
| emailId | character varying | NO |
| password | character varying | YES |
| roleId | bigint | YES |
| imageId | bigint | YES |
| autoResetPassword | boolean | YES |
| isActive | boolean | YES |
| allowLogin | boolean | YES |
| createdBy | bigint | YES |
| updatedBy | bigint | YES |
| deletedBy | bigint | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |
| deletedAt | timestamp with time zone | YES |
| employeeCode | character varying | YES |

**Relationships:**
- `imageId` -> FK -> `fileInfo`
- `roleId` -> FK -> `roleInfo`

---

## Table: `userOTPInfo` (SQL)

| Column | Type | Nullable |
| :--- | :--- | :--- |
| id | bigint | NO |
| userId | bigint | NO |
| otp | integer | NO |
| expirationTime | timestamp with time zone | YES |
| used | boolean | YES |
| createdAt | timestamp with time zone | YES |
| updatedAt | timestamp with time zone | YES |

**Relationships:**
- `userId` -> FK -> `userInfo`

---

## Table: `merchantStagewiseReportInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `transactionActionHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Fri May 24 2024 15:46:57 GMT+0530 (India Standard  |
| deviceId | 100001 |
| messageId | 2 |
| actionStatus | 10 |
| actionId | 66cf0d35a714c5533a15398a |

---

## Table: `deviceNetworkInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| deviceId | 100000 |
| groupId | 13 |
| imei | 862170069224960 |
| imsi | 404100573794792 |
| mobileNo | 0 |
| iccid | 8991102205737947923F |
| mcc | 404 |
| mnc | 10 |
| currentNetworkType | 0 |
| currentRSSI | -32 |
| rsrp | -81 |
| rsrq | 29 |
| snr | 86 |
| operatorName | airtel |
| isActive | true |
| avgRsrp | 0 |
| avgRsrq | 0 |
| avgRssi | 0 |
| avgSnr | 0 |
| dailyAvgRsrp | 0 |
| dailyAvgRsrq | 0 |
| dailyAvgRssi | 0 |
| dailyAvgSnr | 0 |
| statsMessageCount | 0 |
| statsMessageCountDaily | 0 |

---

## Table: `deviceStatsHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `deviceCommonActionInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Thu Sep 04 2025 02:49:44 GMT+0530 (India Standard  |
| metadata | [object Object] |
| actionData | null |
| groupId | 1 |
| actionStatus | 1 |
| actionType | 30 |
| actionSubType | 1 |
| actionId | 68b8b0f08b96f1f2ea422599 |
| actionSummaryId | 68b8b0f08b96f1f2ea422598 |

---

## Table: `deviceConfigHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Wed Sep 17 2025 18:07:09 GMT+0530 (India Standard  |
| deviceId | 102172 |
| eventMask | 9223372036854775807 |
| batteryId | 0 |
| languageId | 0 |
| advertisementIds |  |
| httpStatus | true |
| httpId | 2 |
| statsFreqTimeout | 0 |
| systemAudioId | 0 |
| mqttId | 0 |
| firmwareVersion | 5.0.0 |
| mqttStatus | false |
| currentTime | 9223372036854775807 |

---

## Table: `deviceTerminatedSessionSummaryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `deviceConnectivityMonthlyInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| deviceId | 108898 |
| deviceStatus | 0 |
| httpStatus | true |
| mqttStatus | true |
| isActive | true |
| createdAt | Mon Sep 01 2025 05:30:03 GMT+0530 (India Standard  |
| createdBy | 1 |
| updatedAt | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |
| updatedBy | 0 |
| deviceMode | 60 |

---

## Table: `deliveryTrackingInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `certificateInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| deviceId | 101080 |
| firmwareVersion | 4.1.3 |
| deviceCertificateData | -----BEGIN CERTIFICATE-----
MIIDmjCCAoKgAwIBAgIBAj |
| devicePrivateKeyData | -----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2q |
| expiry | 1732020492 |
| isActive | true |
| updatedCount | 0 |
| createdAt | Wed Aug 21 2024 18:18:12 GMT+0530 (India Standard  |
| updatedAt | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |
| deletedAt | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |

---

## Table: `deviceStageHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `merchantsToDispatchReportInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `deviceBriefHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Wed Aug 21 2024 17:51:49 GMT+0530 (India Standard  |
| deviceId | 100000 |
| mobileNo | 0 |
| imsi | 404920593414526 |
| currentFWVersion | 4.1.3 |
| mnc | 92 |
| totalTransaction | 0 |
| mcc | 404 |
| iccid | 8991922305934145269F |

---

## Table: `actionSummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| totalActionPublishCount | 1 |
| totalActionFailedCount | 0 |
| groupIds | 1 |
| deviceId | 102172 |
| appliedForGroup | false |
| actionExpiryTime | 1756935384 |
| createdAt | Thu Sep 04 2025 02:49:44 GMT+0530 (India Standard  |
| updatedAt | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |

---

## Table: `batteryHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `merchantEventLogHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `webEventLogHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Wed Aug 21 2024 18:06:44 GMT+0530 (India Standard  |
| eventId | 1000 |
| groupId | 0 |
| ipAddress | 10.0.37.191 |
| userAgent | Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20 |
| eventDesc | User is on Soundbox | Login page |
| eventName | User visited Soundbox | Login |
| status | 100 |
| userId | 0 |
| sectionName | Page Visit |
| groupData | [object Object] |
| eventTime | 1724243804 |

---

## Table: `jobHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `deliveryTrackingHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `systemSummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| totalTransactionsCount | 7902932 |
| totalSuccessfulTransactionsCount | 4669363 |
| totalAdvertisementsCount | 22793 |
| totalSuccessfulAdvertisementsCount | 14794 |
| totalTransactionAmount | 11998067951.789995 |
| maxTransactionAmount | 99999.99 |
| minTransactionAmount | 0.01 |
| totalTransactionsRecievedCount | 4678774 |
| totalAdvertisementsRecievedCount | 14969 |

---

## Table: `merchantStageHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `advertisementHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `advertisementActionHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Fri May 24 2024 16:16:33 GMT+0530 (India Standard  |
| deviceId | 100000 |
| addId | 1 |
| actionStatus | 1 |
| actionErrCode | 0 |
| reqRefNo | 0f362848-3ed3-4366-b378-5958c6758a61 |
| messageOriginType | 0 |
| createdBy | 1 |
| messageId | 1 |
| actionId | 66cf0d37a714c5533a15522e |
| deviceAvail | 0 |

---

## Table: `deviceModeHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Fri Sep 19 2025 12:44:47 GMT+0530 (India Standard  |
| deviceId | 101438 |
| deviceMode | 50 |
| month | 9 |
| year | 2025 |
| createdBy | 9 |

---

## Table: `simControlClientHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Thu Nov 21 2024 10:30:24 GMT+0530 (India Standard  |
| metadata | [object Object] |
| status | false |
| deviceId | 100094 |
| ipAddress | 10.0.7.83 |
| createdBy | 9 |
| userAgent | PostmanRuntime/7.42.0 |

---

## Table: `deviceConnectivityMonthlyHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Sun Sep 01 2024 05:30:03 GMT+0530 (India Standard  |
| metadata | [object Object] |
| createdBy | 1 |
| deviceId | 100022 |
| mqttStatus | true |
| httpStatus | true |
| deviceStatus | 20 |

---

## Table: `deviceSessionSummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| deviceId | 100000 |
| deviceTypeId | 5 |
| groupId | 13 |
| groupData | [object Object] |
| mqttStatus | true |
| httpStatus | true |
| imei | 862170069224960 |
| currentFWVersion | 4.1.3 |
| batteryLevel | 100 |
| chargingStatus | 1 |
| lastSeenFromDevice | 1724844337 |
| lastSeenHttp | 1731352140 |
| lastSeenMqtt | 1731346274 |
| lastTenDeviceStats | null |
| isBind | false |
| totalSuccessfulAdvertisementsCount | 5 |
| totalSuccessfulTransactionsCount | 17 |
| totalTransactionAmount | 352287.99 |
| maxTransactionAmount | 99999.99 |
| minTransactionAmount | 1 |
| totalTransactionsRecievedCount | 17 |
| totalAdvertisementsRecievedCount | 5 |
| avgTransactionResponseTime | 0 |
| lastTransactionsBrief | [object Object],[object Object],[object Object],[o |
| isActive | true |
| totalProductionTransactionsCount | 121 |
| totalProductionAdvertisementsCount | 13 |
| totalTransactionsCount | 147 |
| totalTestTransactionsCount | 26 |
| totalAdvertisementsCount | 13 |
| currentTime | 1731353747 |
| totalTestAdvertisementsCount | 0 |
| deviceStage | 511 |
| deviceMode | 60 |
| totalTransactionAmountWeekly | 11670 |
| totalTransactionCountWeekly | 5 |
| totalTransactionCountMonthly | 5 |
| totalTransactionAmountMonthly | 11670 |
| totalTransactionAmountPrevMonth | null |
| totalTransactionCountPrevMonth | null |
| lastTransactionHistory | null |
| totalTransactionAmountDaily | 11670 |
| totalTransactionCountDaily | 5 |
| lastTransactionSummaryReset | Mon Jan 05 2026 21:31:42 GMT+0530 (India Standard  |

---

## Table: `deviceSummaryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `systemDailySummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| date | Fri May 24 2024 05:30:00 GMT+0530 (India Standard  |
| timeZone | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |
| totalActiveDevicesCount | 0 |
| totalTransactionsCount | 4 |
| totalTransactionsRecievedCount | 4 |
| totalAdvertisementsRecievedCount | 3 |
| totalSuccessfulTransactionsCount | 4 |
| totalAdvertisementsCount | 3 |
| totalSuccessfulAdvertisementsCount | 3 |
| totalTransactionAmount | 100026.99 |
| maxTransactionAmount | 99999.99 |
| minTransactionAmount | 9 |
| lastTransactionsBrief | null |
| hourlyTransactionCount | 0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0 |
| hourlyAdvertisementCount | 0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0 |
| hourlyLoginCount | null |
| totalDeviceLogins | 0 |
| totalUserLogins | 0 |
| totalUsersAdded | 0 |
| totalUsersEnabled | 0 |
| totalDevicesAdded | 0 |
| totalMerchantsAdded | 0 |
| totalGroupsAdded | 0 |

---

## Table: `deviceEventLogHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Mon Sep 01 2025 17:07:26 GMT+0530 (India Standard  |
| eventName | loginReq |
| sectionName | Login |
| origin | 10 |
| ipAddress | 10.0.157.236 |
| eventTime | 1756726646 |
| status | 100 |
| metadata | [object Object] |
| userAgent |  |
| imei | 353139635530107 |
| eventDesc | {"IMEI":353139635530107,"IMSI":"404920696112117"," |

---

## Table: `merchantSummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| merchantId | 1000 |
| terminalId |  |
| merchantStageObject | [object Object] |
| lastMerchantStageObjectBrief | [object Object] |

---

## Table: `deviceStatHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Sun Aug 03 2025 16:19:10 GMT+0530 (India Standard  |
| metadata | [object Object] |
| networkQualityBitErr | 99 |
| totalModemResetCount | 0 |
| totalUSBPluginCountSincePowerOn | 2 |
| totalTxTrafficConsumed | 0 |
| volumeDownPressCounts | 0 |
| rxlev | 56 |
| firmwareVersion |  |
| totalFilesDownloadedCount | 0 |
| totalAdvertisementsChangeCount | 0 |
| deviceLastRebootReason | 0 |
| currentTime | 0 |
| deviceModuleVersionStringName |  |
| ipv6 |  |
| totalLanguageChangeCount | 0 |
| ecno | 255 |
| httpPostFailCount | 0 |
| mcc | 404 |
| operatorName | airtel |
| batteryLevel | 0 |
| flashFileReadFailCount | 0 |
| iccid |  |
| totalUSBPluginDuration | 56038 |
| deviceUptime | 43240 |
| totalTransactionsPlayed | 0 |
| volumeUpPressCounts | 0 |
| ipv4 | 10.186.84.190 |
| rscp | 255 |
| totalRxTrafficConsumed | 0 |
| mqttUptime | 0 |
| totalNWDiscDueToBadRSSICount | 0 |
| totalSIMInsertedCount | 0 |
| totalUSBPluginCount | 3 |
| mnc | 92 |
| snr | 56 |
| totalDeviceRebootCount | 0 |
| totalNWFailureCount | 0 |
| networkType | 0 |
| httpDownloadFailCount | 0 |
| lastUSBPluginTimestamp | 1754218131 |
| signalStrength | 0 |
| chargingStatus | 0 |
| totalSystemAudioChangeCount | 0 |
| rsrq | 21 |
| mqttConnectionFailCount | 0 |
| imsi |  |
| rsrp | -101 |
| flashFileWriteFailCount | 0 |
| deviceModemFirmWareName | LE1102LC_4.1.2.3768_24111114_R |
| totalTransactionsFailedToPlay | 0 |
| deviceModuleSerialVersion |  |
| replayPressCounts | 1 |

---

## Table: `deviceConnectivityHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Fri May 24 2024 15:49:09 GMT+0530 (India Standard  |
| deviceId | 100000 |
| httpStatus | false |
| createdBy | 1 |
| month | 5 |
| deviceStatus | 1 |
| year | 2024 |
| mqttStatus | false |

---

## Table: `simControlClientInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| imsi | 404920597519769 |
| deviceId | 100798 |
| onSafeCustody | false |
| lastSafeCustodyPush | Thu Nov 21 2024 13:06:04 GMT+0530 (India Standard  |
| onTempDisconnect | false |
| lastTempDisconnectPush | Mon Jan 01 0001 05:53:28 GMT+0553 (India Standard  |
| totalUpdateCount | 2 |
| ipAddress | 10.0.7.83 |
| userAgent | Apache-HttpClient/5.3.1 (Java/17.0.13) |
| createdBy | 9 |
| updatedBy | 9 |
| createdAt | Thu Nov 21 2024 13:06:04 GMT+0530 (India Standard  |
| updatedAt | Thu Nov 21 2024 13:07:29 GMT+0530 (India Standard  |

---

## Table: `userSummaryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| userId | 1 |
| groupId | 1 |
| emailId | amal.a@cwdin.com |
| firstLoginTime | 1724243894 |
| lastLoginTime | 1765288876 |
| totalLoginCount | 25 |
| lastLoginsBrief | 1724243894,1724244794,1724244891,1724244911,172424 |
| lastEventsBrief |  |
| isActive | true |
| failedAuthenticationCount | 2 |

---

## Table: `simUpdateHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `jobInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `deviceHealthHistoryInfo` (MONGODB)

*(Empty Collection)*


---

## Table: `mqttEventLogHistoryInfo` (MONGODB)

| Field | Sample Value |
| :--- | :--- |
| createdAt | Mon Aug 04 2025 13:00:15 GMT+0530 (India Standard  |
| metadata | [object Object] |
| mqttAddress | m-0.mosquitto-headless.paynearby.svc.cluster.local |
| eventTime | 1754292615 |
| status | 100 |
| mqttBrokerVersion | v2.4.0 |
| eventDesc | {"brokerAddr":"m-0.mosquitto-headless.paynearby.sv |
| eventName | brokerStatusActiveReq |
| mqttPort | 8883 |
| origin | 10 |

---

