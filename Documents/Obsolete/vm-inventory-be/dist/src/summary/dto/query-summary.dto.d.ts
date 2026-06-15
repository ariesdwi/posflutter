export declare enum OsType {
    Ubuntu = "Ubuntu",
    CentOS = "CentOS"
}
export declare class QueryObsoleteDto {
    osType: OsType;
}
export declare class QueryAppMappingDto {
    osType: OsType;
    category?: string;
}
export declare class QueryDepartmentDto {
    osType?: OsType;
}
