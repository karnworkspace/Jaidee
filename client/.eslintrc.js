module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // ปิด warnings ที่ไม่จำเป็น
    'react-hooks/exhaustive-deps': 'warn', // เปลี่ยนจาก error เป็น warn
    'no-unused-vars': 'warn', // เปลี่ยนจาก error เป็น warn
    
    // ปิด deprecation warnings
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    
    // ปิด warnings ที่เกี่ยวกับ webpack dev server
    'import/no-anonymous-default-export': 'off',
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
};
