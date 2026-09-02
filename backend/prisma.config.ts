export default {
    datasource: {
        url:
            process.env.DATABASE_URL ||
            'postgresql://livedog:livedog_dev_password@localhost:5433/livedog'
    }
}
