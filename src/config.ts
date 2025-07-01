// 通过使用 window.location.hostname，前端将自动使用访问网页时所用的主机名或IP地址。
// 这使得局域网内的任何设备都能连接到后端，即使主机的IP地址是动态变化的。
const API_CONFIG = {
  baseURL: `http://${window.location.hostname}:5001`,
  dailyURL: `http://${window.location.hostname}:8081`,
};

export default API_CONFIG;
