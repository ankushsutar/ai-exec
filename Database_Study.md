# Database Study: AI-Exec Ecosystem

**Date:** 2026-02-25T12:30:49.143Z
**Scope:** 45+ Dynamic Enterprise Tables

--- 

## Table: `accessRightsInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"accessRightsInfo_id_seq"'::regclass) |
| accessRightName | character varying | YES | - |
| accessRightDesc | character varying | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `advertisementAudioDeviceRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"advertisementAudioDeviceRelationInfo_id_seq"'::regclass) |
| advertisementID | bigint | YES | - |
| deviceTypeId | bigint | NO | - |
| isDefault | boolean | YES | false |

**Relationships:**
- `advertisementID` -> FK -> [`advertisementAudioInfo`](#table-advertisementaudioinfo)(`id`)
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)

---

## Table: `advertisementAudioInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"advertisementAudioInfo_id_seq"'::regclass) |
| advertisementName | character varying | NO | - |
| advertisementDescription | character varying | YES | - |
| advertisementLanguage | character varying | YES | - |
| advertisementVersion | character varying | NO | - |
| gender | text | YES | 'Male'::text |
| fileId | bigint | YES | - |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `fileId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)

---

## Table: `advertisementInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"advertisementInfo_id_seq"'::regclass) |
| reqRefNo | character varying | YES | - |
| deviceId | bigint | NO | - |
| advertisementId | bigint | NO | - |
| messageOriginType | smallint | YES | 0 |
| time | bigint | YES | - |
| expirationTime | bigint | NO | - |
| tMsgRecvByServer | bigint | YES | - |
| tMsgRecvFromDev | bigint | YES | - |
| tMsgAck | bigint | YES | - |
| tMsgTimeElapsed | bigint | YES | - |
| audioPlayed | smallint | YES | 0 |
| deviceAvail | bigint | YES | 0 |
| createdBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |

---

## Table: `batteryTypeInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| batteryVersionId | bigint | NO | nextval('"batteryTypeInfo_batteryVersionId_seq"'::regclass) |
| batteryType | bigint | NO | - |
| batteryName | character varying | NO | - |
| batteryTypeVersion | character varying | NO | - |
| manufacturerName | character varying | NO | - |
| batteryCapacity | integer | NO | - |
| adcConfig | bytea | YES | - |
| adcConfigVersion | bigint | NO | - |
| isVerified | boolean | YES | false |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `connectivityHistoryInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"connectivityHistoryInfo_id_seq"'::regclass) |
| deviceId | bigint | NO | - |
| connectivityStatus | boolean | YES | - |
| timeStamp | bigint | NO | 0 |
| createdBy | bigint | NO | 0 |
| createdAt | timestamp with time zone | YES | - |

---

## Table: `deviceAdvertisementRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceAdvertisementRelationInfo_id_seq"'::regclass) |
| deviceId | bigint | NO | - |
| advertisementId | bigint | NO | - |
| repeatInterval | integer | YES | 0 |
| repeatCount | smallint | YES | 0 |
| minute | smallint | YES | 0 |
| hour | smallint | YES | 0 |
| dayOfMonth | smallint | YES | 0 |
| month | smallint | YES | 0 |
| dayOfWeek | smallint | YES | 0 |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `advertisementId` -> FK -> [`advertisementAudioInfo`](#table-advertisementaudioinfo)(`id`)
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)

---

## Table: `deviceBriefInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| deviceId | bigint | NO | nextval('"deviceBriefInfo_deviceId_seq"'::regclass) |
| iccid | character varying | YES | - |
| imsi | character varying | YES | - |
| mobileNo | bigint | YES | - |
| mcc | smallint | YES | - |
| mnc | smallint | YES | - |
| batteryLevel | smallint | YES | - |
| currentRSSI | smallint | YES | - |
| currentNetworkType | smallint | YES | - |
| chargingStatus | smallint | YES | - |
| lastSeen | bigint | YES | - |
| currentFWVersion | text | YES | - |
| totalTransaction | bigint | YES | - |
| isBind | boolean | YES | false |
| updatedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)

---

## Table: `deviceConfigInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| deviceId | bigint | NO | nextval('"deviceConfigInfo_deviceId_seq"'::regclass) |
| deviceTypeId | bigint | NO | - |
| deviceMode | smallint | YES | 0 |
| hardwareType | smallint | NO | 0 |
| deviceBriefId | bigint | NO | - |
| firmwareId | bigint | NO | - |
| firmwareMajorVersion | integer | NO | 0 |
| defaultVolume | smallint | NO | 50 |
| enableDisableFallback | boolean | YES | true |
| enableSimBindingLock | boolean | YES | false |
| batteryType | bigint | NO | 0 |
| batteryVersionId | bigint | NO | 0 |
| deviceStage | integer | YES | 0 |
| mqttId | bigint | NO | - |
| mqttStatus | boolean | YES | true |
| mqttCertUpdate | boolean | YES | true |
| httpId | bigint | NO | - |
| httpStatus | boolean | YES | true |
| groupId | bigint | NO | 1 |
| languageId | bigint | NO | - |
| systemAudioId | bigint | NO | - |
| loginTimeout | integer | NO | - |
| configTimeOut | integer | NO | - |
| statFreq | integer | NO | - |
| serverEventControl | smallint | NO | 10 |
| eventLoggerEnabled | boolean | YES | false |
| eventMask | bigint | NO | 0 |
| deviceFeatureMask | bigint | NO | 0 |
| httpPrcntThrshld | smallint | NO | 0 |
| httpDwnldPrcntThrshld | smallint | NO | 5 |
| bootPrcntThrshld | smallint | NO | 1 |
| bootPrcntThrshldWChrg | smallint | NO | 1 |
| audioPlayPrcntThrshld | smallint | NO | 0 |
| fotaBtryPrcntThrshld | smallint | NO | 5 |
| isActive | boolean | YES | - |
| deviceUpdateStatus | smallint | NO | 0 |
| connEnabledAt | bigint | YES | 0 |
| connDisabledAt | bigint | YES | 0 |
| connUpdatedBy | bigint | YES | 0 |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceBriefId` -> FK -> [`deviceBriefInfo`](#table-devicebriefinfo)(`deviceId`)
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)
- `firmwareId` -> FK -> [`firmwareInfo`](#table-firmwareinfo)(`id`)
- `groupId` -> FK -> [`groupInfo`](#table-groupinfo)(`id`)
- `httpId` -> FK -> [`serverInfo`](#table-serverinfo)(`id`)
- `languageId` -> FK -> [`languageAudioInfo`](#table-languageaudioinfo)(`id`)
- `mqttId` -> FK -> [`serverInfo`](#table-serverinfo)(`id`)
- `systemAudioId` -> FK -> [`systemAudioInfo`](#table-systemaudioinfo)(`id`)

---

## Table: `deviceIdentInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceIdentInfo_id_seq"'::regclass) |
| imei | bigint | NO | - |
| apiKey | character varying | NO | - |
| tempApiKey | character varying | NO | - |
| changeApiKey | boolean | NO | false |
| apiKeyCreatedAt | timestamp with time zone | YES | - |
| terminalId | character varying | YES | - |
| relationId | bigint | YES | - |
| mqttSubTopic | character varying | NO | - |
| mqttPubTopic | character varying | NO | - |
| isActive | boolean | YES | true |
| isBind | boolean | YES | false |
| deviceStage | integer | YES | 0 |
| assignedAt | bigint | YES | - |
| unAssignedAt | bigint | YES | - |
| apiKeyChangeFailureCount | bigint | YES | 0 |
| apiKeyChangeFailureResetCount | bigint | YES | 0 |
| apiKeyChangeFailureLastResetTime | timestamp with time zone | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `deviceInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceInfo_id_seq"'::regclass) |
| deviceIdSequence | bigint | NO | - |
| imei | bigint | NO | - |
| deviceTypeId | bigint | NO | - |
| manufacturerTypeID | bigint | NO | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)
- `manufacturerTypeID` -> FK -> [`manufacturerTypeInfo`](#table-manufacturertypeinfo)(`id`)

---

## Table: `deviceRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| relationId | bigint | NO | nextval('"deviceRelationInfo_relationId_seq"'::regclass) |
| deviceId | bigint | NO | - |
| isVerified | boolean | YES | false |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)

---

## Table: `deviceSimRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceSimRelationInfo_id_seq"'::regclass) |
| simIccid | character varying | NO | - |
| deviceId | bigint | NO | - |
| iccidLock | boolean | YES | false |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)
- `simIccid` -> FK -> [`simInfo`](#table-siminfo)(`iccid`)

---

## Table: `deviceStatsInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceStatsInfo_id_seq"'::regclass) |
| deviceId | bigint | NO | - |
| deviceUptime | bigint | YES | - |
| mqttUptime | bigint | YES | - |
| totalTransactionsPlayed | bigint | YES | - |
| totalTransactionsFailedToPlay | bigint | YES | - |
| volumeUpPressCounts | bigint | YES | - |
| volumeDownPressCounts | bigint | YES | - |
| replayPressCounts | bigint | YES | - |
| totalSIMInsertedCount | bigint | YES | - |
| totalModemResetCount | bigint | YES | - |
| totalNWFailureCount | bigint | YES | - |
| totalNWDiscDueToBadRSSICount | bigint | YES | - |
| mqttConnectionFailCount | bigint | YES | - |
| httpPostFailCount | bigint | YES | - |
| httpDownloadFailCount | bigint | YES | - |
| totalFilesDownloadedCount | bigint | YES | - |
| flashFileWriteFailCount | bigint | YES | - |
| flashFileReadFailCount | bigint | YES | - |
| totalLanguageChangeCount | bigint | YES | - |
| totalAdvertisementsChangeCount | bigint | YES | - |
| totalSystemAudioChangeCount | bigint | YES | - |
| createdAt | bigint | YES | - |

**Relationships:**
- `deviceId` -> FK -> [`deviceInfo`](#table-deviceinfo)(`id`)

---

## Table: `deviceTypeInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"deviceTypeInfo_id_seq"'::regclass) |
| name | character varying | NO | - |
| networkType | character varying | NO | - |
| formFactor | character varying | NO | - |
| audioType | character varying | YES | - |
| isActive | boolean | YES | - |
| hardwareVersion | character varying | NO | - |
| manufacturerTypeId | bigint | NO | - |

**Relationships:**
- `manufacturerTypeId` -> FK -> [`manufacturerTypeInfo`](#table-manufacturertypeinfo)(`id`)

---

## Table: `fileInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"fileInfo_id_seq"'::regclass) |
| fileName | character varying | NO | - |
| filePath | character varying | NO | - |
| fileType | smallint | NO | - |
| fileExtention | character varying | NO | - |
| fileChecksum | character varying | YES | - |
| fileDescription | character varying | YES | - |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `firmwareInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"firmwareInfo_id_seq"'::regclass) |
| fwVersion | character varying | NO | - |
| description | character varying | YES | - |
| fileId | bigint | YES | - |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| deviceTypeId | bigint | NO | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)
- `fileId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)

---

## Table: `groupHierarchyInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"groupHierarchyInfo_id_seq"'::regclass) |
| groupLevel | character varying | YES | - |
| groupId | bigint | YES | - |
| levelA | bigint | YES | - |
| levelB | bigint | YES | - |
| levelC | bigint | YES | - |
| levelD | bigint | YES | - |
| levelE | bigint | YES | - |
| levelF | bigint | YES | - |
| levelG | bigint | YES | - |
| levelH | bigint | YES | - |
| levelI | bigint | YES | - |
| levelJ | bigint | YES | - |
| levelK | bigint | YES | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `groupId` -> FK -> [`groupInfo`](#table-groupinfo)(`id`)

---

## Table: `groupInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"groupInfo_id_seq"'::regclass) |
| groupName | character varying | YES | - |
| groupDesc | character varying | YES | - |
| groupLevel | character varying | YES | - |
| imageId | bigint | YES | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `imageId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)

---

## Table: `languageAudioDeviceRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"languageAudioDeviceRelationInfo_id_seq"'::regclass) |
| languageID | bigint | NO | - |
| deviceTypeId | bigint | NO | - |
| isDefault | boolean | YES | false |

**Relationships:**
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)
- `languageID` -> FK -> [`languageAudioInfo`](#table-languageaudioinfo)(`id`)

---

## Table: `languageAudioInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"languageAudioInfo_id_seq"'::regclass) |
| languageName | character varying | NO | - |
| languageDescription | character varying | YES | - |
| languageVersion | character varying | NO | - |
| gender | text | YES | 'Male'::text |
| fileId | bigint | YES | - |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| isMerged | boolean | NO | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `fileId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)

---

## Table: `manufacturerTypeInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"manufacturerTypeInfo_id_seq"'::regclass) |
| name | character varying | NO | - |
| addressDetails1 | character varying | YES | - |
| addressDetails2 | character varying | YES | - |
| addressDetails3 | character varying | YES | - |
| email | character varying | NO | - |
| mobileNo | character varying | YES | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `merchantAuthInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"merchantAuthInfo_id_seq"'::regclass) |
| merchantId | character varying | NO | - |
| merchantDetailsConfirmed | boolean | YES | false |
| merchantMobileNo | character varying | YES | - |
| otp | integer | YES | - |
| otpCreatedAt | timestamp with time zone | YES | - |
| otpCheckFailedCount | smallint | YES | - |
| dailyOtpRequestCount | smallint | YES | - |
| otpUsed | boolean | YES | - |
| otpLockedTill | timestamp with time zone | YES | - |
| mpin | character varying | YES | - |
| mpinCreatedAt | timestamp with time zone | YES | - |
| mpinCheckFailedCount | smallint | YES | - |
| mpinValid | boolean | YES | - |
| resetMpinLockedTill | timestamp with time zone | YES | - |
| profileLockedTill | timestamp with time zone | YES | - |
| isStaticOTPEnabled | boolean | YES | false |
| isActive | boolean | YES | true |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `merchantId` -> FK -> [`merchantInfo`](#table-merchantinfo)(`merchantId`)

---

## Table: `merchantInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"merchantInfo_id_seq"'::regclass) |
| reqRefNo | character varying | NO | - |
| merchantId | character varying | NO | - |
| groupId | bigint | NO | 1 |
| merchantCategoryCode | character varying | YES | - |
| merchantBusinessName | character varying | YES | - |
| merchantLegalName | character varying | YES | - |
| merchantAddressDetails1 | character varying | YES | - |
| merchantAddressDetails2 | character varying | YES | - |
| merchantAddressDetails3 | character varying | YES | - |
| merchantCity | character varying | YES | - |
| merchantState | character varying | YES | - |
| merchantPincode | character varying | YES | - |
| merchantMobileNo | character varying | NO | - |
| merchantEmailId | character varying | NO | - |
| merchantContactName | character varying | YES | - |
| isBind | boolean | YES | false |
| deviceClientId | text | YES | - |
| merchantStage | integer | YES | 0 |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |
| assignedAt | bigint | YES | - |
| assignedBy | bigint | YES | - |
| unAssignedAt | bigint | YES | - |
| unAssignedBy | bigint | YES | - |

**Relationships:**
- `groupId` -> FK -> [`groupInfo`](#table-groupinfo)(`id`)

---

## Table: `merchantRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| relationId | bigint | NO | nextval('"merchantRelationInfo_relationId_seq"'::regclass) |
| merchantId | character varying | NO | - |
| isBind | boolean | YES | false |
| isVerified | boolean | YES | false |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `merchantId` -> FK -> [`merchantInfo`](#table-merchantinfo)(`merchantId`)

---

## Table: `monthlyActiveDevicesInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"monthlyActiveDevicesInfo_id_seq"'::regclass) |
| deviceId | bigint | NO | - |
| timeStamp | bigint | NO | 0 |
| createdBy | bigint | NO | 0 |
| createdAt | timestamp with time zone | YES | - |

---

## Table: `mqttBrokerInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"mqttBrokerInfo_id_seq"'::regclass) |
| brokerAddr | character varying | YES | - |
| brokerPortNo | integer | NO | - |
| brokerStatus | smallint | YES | 0 |
| devicesConnected | bigint | YES | 0 |
| connLimit | bigint | NO | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `mqttUserInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"mqttUserInfo_id_seq"'::regclass) |
| mqttBrokerId | bigint | NO | 0 |
| mqttSubTopic | character varying | NO | - |
| mqttPubTopic | character varying | NO | - |
| isConnected | boolean | YES | false |
| mqttTranStatus | boolean | YES | false |
| mqttAdvStatus | boolean | YES | false |
| deviceMode | smallint | YES | 0 |
| lastSeen | bigint | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `id` -> FK -> [`deviceConfigInfo`](#table-deviceconfiginfo)(`deviceId`)

---

## Table: `qrInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"qrInfo_id_seq"'::regclass) |
| merchantVPA | character varying | YES | - |
| qrType | character varying | YES | - |
| qrString | character varying | YES | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `qrRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| relationId | bigint | NO | nextval('"qrRelationInfo_relationId_seq"'::regclass) |
| qrId | bigint | NO | - |
| isVerified | boolean | YES | false |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `qrId` -> FK -> [`qrInfo`](#table-qrinfo)(`id`)

---

## Table: `roleInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"roleInfo_id_seq"'::regclass) |
| roleName | character varying | NO | - |
| roleDesc | character varying | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `rolesAccessRightsInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"rolesAccessRightsInfo_id_seq"'::regclass) |
| roleId | bigint | YES | - |
| accessRightId | bigint | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `accessRightId` -> FK -> [`accessRightsInfo`](#table-accessrightsinfo)(`id`)
- `roleId` -> FK -> [`roleInfo`](#table-roleinfo)(`id`)

---

## Table: `serverInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"serverInfo_id_seq"'::regclass) |
| serverHostName | character varying | YES | - |
| serverPortNo | integer | NO | - |
| serverKeepAlive | integer | NO | - |
| authType | smallint | NO | 0 |
| mqttQOS | smallint | NO | 0 |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| serverType | smallint | YES | 0 |
| defaultServer | boolean | YES | false |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `simInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| iccid | character varying | NO | - |
| simProviderId | bigint | NO | - |
| activationDate | timestamp with time zone | NO | - |
| expiryDate | timestamp with time zone | NO | - |
| dataType | character varying | NO | - |
| dataUsed | numeric | NO | - |
| dataUnits | bigint | NO | - |
| planName | character varying | NO | - |
| planStatus | character varying | NO | - |
| smsUnits | bigint | NO | - |
| smsUsed | bigint | NO | - |
| deviceId | bigint | YES | 0 |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `simOperatorInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"simOperatorInfo_id_seq"'::regclass) |
| operatorId | bigint | NO | - |
| operatorName | character varying | NO | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `simProfileInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"simProfileInfo_id_seq"'::regclass) |
| profileId | integer | NO | - |
| imsi | character varying | NO | - |
| msisdn | character varying | NO | - |
| simIccid | character varying | NO | - |
| operatorName | character varying | NO | - |
| operatorId | bigint | NO | - |
| isWhiteListed | boolean | NO | - |
| smsStatus | boolean | NO | - |
| profilePathInSim | character varying | NO | - |
| priority | integer | NO | - |
| simStatus | integer | NO | - |
| planName | character varying | NO | - |
| planCode | character varying | NO | - |
| apnType | character varying | NO | - |
| apnName | character varying | NO | - |
| apnIpType | character varying | NO | - |
| dataUsed | numeric | NO | - |
| dataType | character varying | NO | - |
| smsUsage | bigint | NO | - |
| lastStatus | integer | NO | - |
| lastSafeCustodyUpdate | timestamp with time zone | NO | - |
| totalUpdateCount | bigint | NO | - |
| isActive | boolean | YES | true |
| activationDate | timestamp with time zone | NO | - |
| expiryDate | timestamp with time zone | NO | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `operatorId` -> FK -> [`simOperatorInfo`](#table-simoperatorinfo)(`operatorId`)
- `simIccid` -> FK -> [`simInfo`](#table-siminfo)(`iccid`)

---

## Table: `systemAudioDeviceRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"systemAudioDeviceRelationInfo_id_seq"'::regclass) |
| systemID | bigint | NO | - |
| deviceTypeId | bigint | NO | - |
| isDefault | boolean | YES | false |

**Relationships:**
- `deviceTypeId` -> FK -> [`deviceTypeInfo`](#table-devicetypeinfo)(`id`)
- `systemID` -> FK -> [`systemAudioInfo`](#table-systemaudioinfo)(`id`)

---

## Table: `systemAudioInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"systemAudioInfo_id_seq"'::regclass) |
| systemAudioName | character varying | NO | - |
| systemAudioDescription | character varying | YES | - |
| systemAudioVersion | character varying | NO | - |
| gender | text | YES | 'Male'::text |
| fileId | bigint | YES | - |
| isActive | boolean | YES | - |
| isVerified | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `fileId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)

---

## Table: `terminalInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"terminalInfo_id_seq"'::regclass) |
| terminalId | character varying | NO | - |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

---

## Table: `terminalRelationInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| relationId | bigint | NO | nextval('"terminalRelationInfo_relationId_seq"'::regclass) |
| terminalId | character varying | NO | - |
| isVerified | boolean | YES | false |
| isActive | boolean | YES | true |
| createdBy | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |
| updatedBy | bigint | YES | 0 |
| updatedAt | timestamp with time zone | YES | - |
| deletedBy | bigint | YES | 0 |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `terminalId` -> FK -> [`terminalInfo`](#table-terminalinfo)(`terminalId`)

---

## Table: `transactionInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"transactionInfo_id_seq"'::regclass) |
| reqRefNo | character varying | YES | - |
| rrn | character varying | NO | - |
| transactionType | smallint | YES | 0 |
| messageOriginType | smallint | YES | 0 |
| transactionMode | smallint | YES | 0 |
| amount | character varying | NO | - |
| txnTime | character varying | YES | - |
| time | bigint | YES | - |
| deviceId | bigint | NO | - |
| expirationTime | bigint | NO | - |
| tMsgRecvByServer | bigint | YES | - |
| tMsgRecvFromDev | bigint | YES | - |
| tMsgAck | bigint | YES | - |
| tMsgTimeElapsed | bigint | YES | - |
| audioPlayed | smallint | YES | 0 |
| deviceAvail | bigint | YES | 0 |
| createdAt | timestamp with time zone | YES | - |

---

## Table: `userAPIKeysInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"userAPIKeysInfo_id_seq"'::regclass) |
| userId | bigint | NO | - |
| APIKey | character varying | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `userId` -> FK -> [`userInfo`](#table-userinfo)(`id`)

---

## Table: `userGroupInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"userGroupInfo_id_seq"'::regclass) |
| userId | bigint | NO | - |
| groupId | bigint | YES | - |
| groupLevel | character varying | YES | - |
| isActive | boolean | YES | - |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `groupId` -> FK -> [`groupInfo`](#table-groupinfo)(`id`)
- `userId` -> FK -> [`userInfo`](#table-userinfo)(`id`)

---

## Table: `userInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"userInfo_id_seq"'::regclass) |
| firstName | character varying | YES | - |
| lastName | character varying | YES | - |
| employeeCode | character varying | YES | ''::character varying |
| location | character varying | YES | - |
| countryCode | character varying | YES | - |
| mobileNo | text | YES | - |
| emailId | character varying | NO | - |
| password | character varying | YES | - |
| roleId | bigint | YES | - |
| imageId | bigint | YES | - |
| autoResetPassword | boolean | YES | - |
| lastOTPRequest | timestamp with time zone | YES | - |
| isActive | boolean | YES | - |
| allowLogin | boolean | YES | true |
| createdBy | bigint | YES | - |
| updatedBy | bigint | YES | - |
| deletedBy | bigint | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |
| deletedAt | timestamp with time zone | YES | - |

**Relationships:**
- `imageId` -> FK -> [`fileInfo`](#table-fileinfo)(`id`)
- `roleId` -> FK -> [`roleInfo`](#table-roleinfo)(`id`)

---

## Table: `userOTPInfo`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| id | bigint | NO | nextval('"userOTPInfo_id_seq"'::regclass) |
| userId | bigint | NO | - |
| otp | integer | NO | - |
| expirationTime | timestamp with time zone | YES | - |
| used | boolean | YES | - |
| createdAt | timestamp with time zone | YES | - |
| updatedAt | timestamp with time zone | YES | - |

**Relationships:**
- `userId` -> FK -> [`userInfo`](#table-userinfo)(`id`)

---

