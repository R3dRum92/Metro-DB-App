from typing import List

from app.routes.common_imports import *

router = APIRouter()


class DemographicData(BaseModel):
    name: str
    value: int


@router.get("/user_demographics")
async def get_user_demographics():
    """
    Get metrics for the dashboard including counts and statistics.
    This endpoint performs several database queries to calculate key metrics.
    """
    try:
        conn = await get_db_connection()
        try:
            # Get total counts
            rows = await conn.fetch(
                """
                WITH user_ages AS (
                  SELECT
                    DATE_PART('year', AGE(CURRENT_DATE, date_of_birth)) AS age
                  FROM users
                )
                SELECT
                  age_category AS age_group,
                  COUNT(*) AS value
                FROM (
                  SELECT
                    CASE
                      WHEN age BETWEEN 18 AND 24 THEN '18-24'
                      WHEN age BETWEEN 25 AND 34 THEN '25-34'
                      WHEN age BETWEEN 35 AND 44 THEN '35-44'
                      WHEN age BETWEEN 45 AND 54 THEN '45-54'
                      WHEN age >= 55 THEN '55+'
                    END AS age_category
                  FROM user_ages
                  WHERE age >= 18
                ) AS categorized_ages
                GROUP BY age_category
                ORDER BY
                  CASE
                    WHEN age_category = '18-24' THEN 1
                    WHEN age_category = '25-34' THEN 2
                    WHEN age_category = '35-44' THEN 3
                    WHEN age_category = '45-54' THEN 4
                    WHEN age_category = '55+' THEN 5
                  END;
                """
            )
            ret = []
            for row in rows:
                ret.append({"name": row["age_group"], "value": row["value"]})
            return ret  # Return the array directly, not wrapped in a dict
        except Exception as e:
            logger.error(f"Error fetching dashboard metrics: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch dashboard metrics. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
