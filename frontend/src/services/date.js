export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // дата приходит в формате ГГГГ-ММ-ДД
    if (dateString.includes('T') === false && dateString.length === 10) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    }
    
    // Для полноценных ISO строк
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
};