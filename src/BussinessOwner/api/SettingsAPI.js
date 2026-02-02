import { getRestaurantId } from "../../utils/auth";

const BASE_URL = "https://apiqrcodeexe201-production.up.railway.app";

const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

// Danh sách ngân hàng hỗ trợ VietQR
export const SUPPORTED_BANKS = [
    { code: 'MB', name: 'MB Bank', logo: 'https://api.vietqr.io/img/MB.png' },
    { code: 'VCB', name: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
    { code: 'TCB', name: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
    { code: 'ACB', name: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
    { code: 'VPB', name: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
    { code: 'TPB', name: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png' },
    { code: 'BIDV', name: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
    { code: 'VTB', name: 'Vietinbank', logo: 'https://api.vietqr.io/img/CTG.png' },
    { code: 'SHB', name: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
    { code: 'MSB', name: 'MSB', logo: 'https://api.vietqr.io/img/MSB.png' },
];

/**
 * Lấy trạng thái ngân hàng của nhà hàng
 */
export const getBankSettings = async (restaurantId) => {
    const restId = restaurantId || getRestaurantId();
    const res = await fetch(
        `${BASE_URL}/api/v1/restaurants/${restId}/sepay/status`,
        { headers: getAuthHeaders() }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Lấy thông tin ngân hàng thất bại");
    }

    return res.json();
};

/**
 * Liên kết tài khoản ngân hàng
 */
export const linkBankAccount = async (restaurantId, bankData) => {
    const restId = restaurantId || getRestaurantId();
    const res = await fetch(
        `${BASE_URL}/api/v1/restaurants/${restId}/sepay/link`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                bank_code: bankData.bank_code,
                account_number: bankData.account_number,
                account_name: bankData.account_name,
            }),
        }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Liên kết ngân hàng thất bại");
    }

    return res.json();
};

/**
 * Hủy liên kết ngân hàng
 */
export const unlinkBankAccount = async (restaurantId) => {
    const restId = restaurantId || getRestaurantId();
    const res = await fetch(
        `${BASE_URL}/api/v1/restaurants/${restId}/sepay/unlink`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Hủy liên kết thất bại");
    }

    return res.json();
};

/**
 * Lấy thông tin gói hiện tại của nhà hàng
 */
export const getCurrentPackage = async (restaurantId) => {
    const restId = restaurantId || getRestaurantId();
    const res = await fetch(
        `${BASE_URL}/api/v1/restaurants/${restId}`,
        { headers: getAuthHeaders() }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Lấy thông tin nhà hàng thất bại");
    }

    return res.json();
};

/**
 * Lấy danh sách tất cả gói dịch vụ
 */
export const getAllPackages = async () => {
    const res = await fetch(`${BASE_URL}/api/v1/packages`);

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Lấy danh sách gói thất bại");
    }

    return res.json();
};
